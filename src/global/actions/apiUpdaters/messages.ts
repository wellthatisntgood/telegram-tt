import type {
  ApiChat, ApiMessage, ApiPollResult, ApiReactions,
} from '../../../api/types';
import type { ThreadId } from '../../../types';
import type { RequiredGlobalActions } from '../../index';
import type {
  ActionReturnType, ActiveEmojiInteraction, GlobalState, RequiredGlobalState,
} from '../../types';
import { MAIN_THREAD_ID } from '../../../api/types';

import { SERVICE_NOTIFICATIONS_USER_ID } from '../../../config';
import { areDeepEqual } from '../../../util/areDeepEqual';
import { getCurrentTabId } from '../../../util/establishMultitabRole';
import { omit, pickTruthy, unique } from '../../../util/iteratees';
import { getMessageKey, isLocalMessageId } from '../../../util/messageKey';
import { notifyAboutMessage } from '../../../util/notifications';
import { onTickEnd } from '../../../util/schedulers';
import {
  checkIfHasUnreadReactions, getIsSavedDialog, getMessageContent, getMessageText, isActionMessage,
  isMessageLocal, isUserId,
} from '../../helpers';
import { getMessageReplyInfo, getStoryReplyInfo } from '../../helpers/replies';
import { addActionHandler, getGlobal, setGlobal } from '../../index';
import {
  addMessages,
  addViewportId,
  clearMessageTranslation,
  deleteChatMessages,
  deleteChatScheduledMessages,
  deleteTopic,
  removeChatFromChatLists,
  replaceThreadParam,
  updateChat,
  updateChatLastMessageId,
  updateChatMessage,
  updateListedIds,
  updateMessageTranslations,
  updateScheduledMessage,
  updateThreadInfo,
  updateThreadInfos,
  updateThreadUnreadFromForwardedMessage,
  updateTopic,
} from '../../reducers';
import { updateUnreadReactions } from '../../reducers/reactions';
import { updateTabState } from '../../reducers/tabs';
import {
  selectChat,
  selectChatLastMessageId,
  selectChatMessage,
  selectChatMessageByPollId,
  selectChatMessages,
  selectChatScheduledMessages,
  selectCommonBoxChatId,
  selectCurrentMessageList,
  selectFirstUnreadId,
  selectIsChatListed,
  selectIsChatWithSelf,
  selectIsMessageInCurrentMessageList,
  selectIsServiceChatReady,
  selectIsViewportNewest,
  selectListedIds,
  selectPerformanceSettingsValue,
  selectPinnedIds,
  selectSavedDialogIdFromMessage,
  selectScheduledIds,
  selectScheduledMessage,
  selectSendAs,
  selectTabState,
  selectThreadByMessage,
  selectThreadIdFromMessage,
  selectThreadInfo,
  selectTopicFromMessage,
  selectViewportIds,
} from '../../selectors';

const ANIMATION_DELAY = 350;

addActionHandler('apiUpdate', (global, actions, update): ActionReturnType => {
  switch (update['@type']) {
    case 'newMessage': {
      const {
        chatId, id, message, shouldForceReply, wasDrafted,
      } = update;
      global = updateWithLocalMedia(global, chatId, id, message);
      global = updateListedAndViewportIds(global, actions, message as ApiMessage);

      const newMessage = selectChatMessage(global, chatId, id)!;
      const replyInfo = getMessageReplyInfo(newMessage);
      const storyReplyInfo = getStoryReplyInfo(newMessage);
      const chat = selectChat(global, chatId);
      if (chat?.isForum
        && replyInfo?.isForumTopic
        && !selectTopicFromMessage(global, newMessage)
        && replyInfo.replyToMsgId) {
        actions.loadTopicById({ chatId, topicId: replyInfo.replyToMsgId });
      }

      const isLocal = isMessageLocal(message as ApiMessage);

      Object.values(global.byTabId).forEach(({ id: tabId }) => {
        // Force update for last message on drafted messages to prevent flickering
        if (isLocal && wasDrafted) {
          global = updateChatLastMessage(global, chatId, newMessage);
        }

        if (selectIsMessageInCurrentMessageList(global, chatId, message as ApiMessage, tabId)) {
          if (isLocal && message.isOutgoing && !(message.content?.action) && !storyReplyInfo?.storyId
            && !message.content?.storyData) {
            const currentMessageList = selectCurrentMessageList(global, tabId);
            if (currentMessageList) {
              // We do not use `actions.focusLastMessage` as it may be set with a delay (see below)
              actions.focusMessage({
                chatId,
                threadId: currentMessageList.threadId,
                messageId: message.id!,
                noHighlight: true,
                isResizingContainer: true,
                tabId,
              });
            }
          }

          // @perf Wait until scroll animation finishes or simply rely on delivery status update
          // (which is itself delayed)
          if (!isLocal) {
            setTimeout(() => {
              global = getGlobal();
              if (shouldForceReply) {
                actions.updateDraftReplyInfo({
                  replyToMsgId: id,
                  tabId,
                });
              }
              global = updateChatLastMessage(global, chatId, newMessage);
              setGlobal(global);
            }, ANIMATION_DELAY);
          }
        } else {
          global = updateChatLastMessage(global, chatId, newMessage);
        }
      });

      setGlobal(global);

      // Reload dialogs if chat is not present in the list
      if (!selectIsChatListed(global, chatId)) {
        actions.loadTopChats();
      }

      if (selectIsChatWithSelf(global, chatId) && !isLocal) {
        const savedDialogId = selectSavedDialogIdFromMessage(global, newMessage);
        if (savedDialogId && !selectIsChatListed(global, savedDialogId, 'saved')) {
          actions.requestSavedDialogUpdate({ chatId: savedDialogId });
        }
      }

      break;
    }

    case 'updateChatLastMessage': {
      const { id, lastMessage } = update;

      global = updateChatLastMessage(global, id, lastMessage, true);
      global = addMessages(global, [lastMessage]);
      setGlobal(global);
      break;
    }

    case 'updateStartEmojiInteraction': {
      Object.values(global.byTabId).forEach(({ id: tabId }) => {
        const { chatId: currentChatId } = selectCurrentMessageList(global, tabId) || {};

        if (currentChatId !== update.id) return;
        const message = selectChatMessage(global, currentChatId, update.messageId);

        if (!message) return;

        // Workaround for a weird behavior when interaction is received after watching reaction
        if (getMessageText(message) !== update.emoji) return;

        const tabState = selectTabState(global, tabId);
        global = updateTabState(global, {
          activeEmojiInteractions: [...(tabState.activeEmojiInteractions || []), {
            id: Math.random(),
            animatedEffect: update.emoji,
            messageId: update.messageId,
          } as ActiveEmojiInteraction],
        }, tabId);
      });

      setGlobal(global);

      break;
    }

    case 'newScheduledMessage': {
      const { chatId, id, message } = update;

      global = updateWithLocalMedia(global, chatId, id, message, true);

      const scheduledIds = selectScheduledIds(global, chatId, MAIN_THREAD_ID) || [];
      global = replaceThreadParam(global, chatId, MAIN_THREAD_ID, 'scheduledIds', unique([...scheduledIds, id]));

      const threadId = selectThreadIdFromMessage(global, message);
      if (threadId !== MAIN_THREAD_ID) {
        const threadScheduledIds = selectScheduledIds(global, chatId, threadId) || [];
        global = replaceThreadParam(global, chatId, threadId, 'scheduledIds', unique([...threadScheduledIds, id]));
      }

      setGlobal(global);

      break;
    }

    case 'updateMessage': {
      const { chatId, id, message } = update;

      const currentMessage = selectChatMessage(global, chatId, id);
      const chat = selectChat(global, chatId);

      global = updateWithLocalMedia(global, chatId, id, message);

      const newMessage = selectChatMessage(global, chatId, id)!;

      if (message.reactions && chat) {
        global = updateReactions(
          global, actions, chatId, id, message.reactions, chat, newMessage.isOutgoing, currentMessage,
        );
      }

      if (message.content?.text?.text !== currentMessage?.content?.text?.text) {
        global = clearMessageTranslation(global, chatId, id);
      }

      setGlobal(global);

      break;
    }

    case 'updateScheduledMessage': {
      const { chatId, id, message } = update;

      const currentMessage = selectScheduledMessage(global, chatId, id);
      if (!currentMessage) {
        return;
      }

      global = updateWithLocalMedia(global, chatId, id, message, true);
      const ids = Object.keys(selectChatScheduledMessages(global, chatId) || {}).map(Number).sort((a, b) => b - a);
      global = replaceThreadParam(global, chatId, MAIN_THREAD_ID, 'scheduledIds', ids);

      const threadId = selectThreadIdFromMessage(global, currentMessage);
      if (threadId !== MAIN_THREAD_ID) {
        const threadScheduledIds = selectScheduledIds(global, chatId, threadId) || [];
        global = replaceThreadParam(global, chatId, threadId, 'scheduledIds', threadScheduledIds.sort((a, b) => b - a));
      }
      setGlobal(global);

      break;
    }

    case 'updateMessageSendSucceeded': {
      const { chatId, localId, message } = update;

      global = updateListedAndViewportIds(global, actions, message as ApiMessage);

      const currentMessage = selectChatMessage(global, chatId, localId);

      global = deleteChatMessages(global, chatId, [localId]);

      // Edge case for "Send When Online"
      if (message.isScheduled) {
        global = deleteChatScheduledMessages(global, chatId, [localId]);
      }

      global = updateChatMessage(global, chatId, message.id, {
        ...currentMessage,
        ...message,
        previousLocalId: localId,
      });

      global = {
        ...global,
        fileUploads: {
          byMessageKey: omit(global.fileUploads.byMessageKey, [getMessageKey(message)]),
        },
      };

      const newMessage = selectChatMessage(global, chatId, message.id)!;
      global = updateChatLastMessage(global, chatId, newMessage);

      const thread = selectThreadByMessage(global, message);
      // For some reason Telegram requires to manually mark outgoing thread messages read
      Object.values(global.byTabId).forEach(({ id: tabId }) => {
        const { chatId: currentChatId, threadId: currentThreadId } = selectCurrentMessageList(global, tabId) || {};
        if (currentChatId !== chatId
          || (thread?.threadInfo?.threadId || MAIN_THREAD_ID) !== currentThreadId) {
          return;
        }

        actions.markMessageListRead({ maxId: message.id, tabId });
      });
      if (thread?.threadInfo?.threadId) {
        global = replaceThreadParam(global, chatId, thread.threadInfo.threadId, 'threadInfo', {
          ...thread.threadInfo,
          lastMessageId: message.id,
          lastReadInboxMessageId: message.id,
        });
      }

      global = updateChat(global, chatId, {
        lastReadInboxMessageId: message.id,
      });

      if (selectIsChatWithSelf(global, chatId)) {
        const savedDialogId = selectSavedDialogIdFromMessage(global, newMessage);
        if (savedDialogId && !selectIsChatListed(global, savedDialogId, 'saved')) {
          actions.requestSavedDialogUpdate({ chatId: savedDialogId });
        }
      }

      setGlobal(global);

      break;
    }

    case 'updateScheduledMessageSendSucceeded': {
      const { chatId, localId, message } = update;
      const scheduledIds = selectScheduledIds(global, chatId, MAIN_THREAD_ID) || [];
      global = replaceThreadParam(global, chatId, MAIN_THREAD_ID, 'scheduledIds', [...scheduledIds, message.id]);

      const threadId = selectThreadIdFromMessage(global, message);
      if (threadId !== MAIN_THREAD_ID) {
        const threadScheduledIds = selectScheduledIds(global, chatId, threadId) || [];
        global = replaceThreadParam(global, chatId, threadId, 'scheduledIds', [...threadScheduledIds, message.id]);
      }

      const currentMessage = selectScheduledMessage(global, chatId, localId);

      global = deleteChatScheduledMessages(global, chatId, [localId]);
      global = updateScheduledMessage(global, chatId, message.id, {
        ...currentMessage,
        ...message,
        previousLocalId: localId,
      });

      setGlobal(global);
      break;
    }

    case 'updatePinnedIds': {
      const { chatId, isPinned, messageIds } = update;

      const messages = pickTruthy(selectChatMessages(global, chatId), messageIds);
      const updatePerThread: Record<ThreadId, number[]> = {
        [MAIN_THREAD_ID]: messageIds,
      };
      Object.values(messages).forEach((message) => {
        const threadId = selectThreadIdFromMessage(global, message);
        global = updateChatMessage(global, chatId, message.id, {
          isPinned,
        });
        if (threadId === MAIN_THREAD_ID) return;
        const currentUpdatedInThread = updatePerThread[threadId] || [];
        currentUpdatedInThread.push(message.id);
        updatePerThread[threadId] = currentUpdatedInThread;
      });

      Object.entries(updatePerThread).forEach(([threadId, ids]) => {
        const pinnedIds = selectPinnedIds(global, chatId, MAIN_THREAD_ID) || [];
        const newPinnedIds = isPinned
          ? unique(pinnedIds.concat(ids)).sort((a, b) => b - a)
          : pinnedIds.filter((id) => !ids.includes(id));
        global = replaceThreadParam(global, chatId, Number(threadId), 'pinnedIds', newPinnedIds);
      });
      setGlobal(global);

      break;
    }

    case 'updateThreadInfos': {
      const {
        threadInfoUpdates,
      } = update;

      global = updateThreadInfos(global, threadInfoUpdates);
      threadInfoUpdates.forEach((threadInfo) => {
        const { chatId, threadId } = threadInfo;
        if (!chatId || !threadId) return;

        const chat = selectChat(global, chatId);
        const currentThreadInfo = selectThreadInfo(global, chatId, threadId);
        if (chat?.isForum && threadInfo.lastReadInboxMessageId !== currentThreadInfo?.lastReadInboxMessageId) {
          actions.loadTopicById({ chatId, topicId: Number(threadId) });
        }

        // Update reply thread last read message id if already read in main thread
        if (!chat?.isForum) {
          const lastReadInboxMessageId = chat?.lastReadInboxMessageId;
          const lastReadInboxMessageIdInThread = threadInfo.lastReadInboxMessageId || lastReadInboxMessageId;
          if (lastReadInboxMessageId && lastReadInboxMessageIdInThread) {
            global = updateThreadInfo(global, chatId, threadId, {
              lastReadInboxMessageId: Math.max(lastReadInboxMessageIdInThread, lastReadInboxMessageId),
            });
          }
        }
      });
      setGlobal(global);

      break;
    }

    case 'resetMessages': {
      const { id: chatId } = update;
      const messagesById = selectChatMessages(global, chatId);

      if (messagesById && !isUserId(chatId)) {
        const tabId = getCurrentTabId();
        global = deleteChatMessages(global, chatId, Object.keys(messagesById).map(Number));
        setGlobal(global);
        actions.loadFullChat({ chatId, force: true, tabId });
        actions.loadViewportMessages({ chatId, threadId: MAIN_THREAD_ID, tabId });
      }

      break;
    }

    case 'deleteMessages': {
      const { ids, chatId } = update;

      deleteMessages(global, chatId, ids, actions);
      break;
    }

    case 'deleteScheduledMessages': {
      const { ids, chatId } = update;

      deleteScheduledMessages(chatId, ids, actions, global);
      break;
    }

    case 'deleteHistory': {
      const { chatId } = update;
      const chatMessages = global.messages.byChatId[chatId];
      if (chatId === SERVICE_NOTIFICATIONS_USER_ID) {
        global = {
          ...global,
          serviceNotifications: global.serviceNotifications.map((notification) => ({
            ...notification,
            isDeleted: true,
          })),
        };
        setGlobal(global);
      }

      if (chatMessages) {
        const ids = Object.keys(chatMessages.byId).map(Number);
        global = getGlobal();
        deleteMessages(global, chatId, ids, actions);
      } else {
        actions.requestChatUpdate({ chatId });
      }

      global = getGlobal();
      global = removeChatFromChatLists(global, chatId);
      setGlobal(global);

      break;
    }

    case 'deleteSavedHistory': {
      const { chatId } = update;
      const currentUserId = global.currentUserId!;
      global = removeChatFromChatLists(global, chatId, 'saved');
      setGlobal(global);

      global = getGlobal();
      deleteThread(global, currentUserId, chatId, actions);

      break;
    }

    case 'updateCommonBoxMessages': {
      const { ids, messageUpdate } = update;

      ids.forEach((id) => {
        const chatId = selectCommonBoxChatId(global, id);
        if (chatId) {
          global = updateChatMessage(global, chatId, id, messageUpdate);
        }
      });

      setGlobal(global);

      break;
    }

    case 'updateChannelMessages': {
      const { channelId, ids, messageUpdate } = update;

      ids.forEach((id) => {
        global = updateChatMessage(global, channelId, id, messageUpdate);
      });

      setGlobal(global);

      break;
    }

    case 'updateMessagePoll': {
      const { pollId, pollUpdate } = update;

      const message = selectChatMessageByPollId(global, pollId);

      if (message?.content.poll) {
        const oldResults = message.content.poll.results;
        let newResults = oldResults;
        if (pollUpdate.results?.results) {
          if (!oldResults.results || !pollUpdate.results.isMin) {
            newResults = pollUpdate.results;
          } else if (oldResults.results) {
            newResults = {
              ...pollUpdate.results,
              results: pollUpdate.results.results.map((result) => ({
                ...result,
                isChosen: oldResults.results!.find((r) => r.option === result.option)?.isChosen,
              })),
              isMin: undefined,
            };
          }
        }
        const updatedPoll = { ...message.content.poll, ...pollUpdate, results: newResults };

        global = updateChatMessage(
          global,
          message.chatId,
          message.id,
          {
            content: {
              ...message.content,
              poll: updatedPoll,
            },
          },
        );
        setGlobal(global);
      }
      break;
    }

    case 'updateMessagePollVote': {
      const { pollId, peerId, options } = update;
      const message = selectChatMessageByPollId(global, pollId);
      if (!message || !message.content.poll || !message.content.poll.results) {
        break;
      }

      const { poll } = message.content;

      const currentSendAs = selectSendAs(global, message.chatId);

      const { recentVoterIds, totalVoters, results } = poll.results;
      const newRecentVoterIds = recentVoterIds ? [...recentVoterIds] : [];
      const newTotalVoters = totalVoters ? totalVoters + 1 : 1;
      const newResults = results ? [...results] : [];

      newRecentVoterIds.push(peerId);

      options.forEach((option) => {
        const targetOptionIndex = newResults.findIndex((result) => result.option === option);
        const targetOption = newResults[targetOptionIndex];
        const updatedOption: ApiPollResult = targetOption ? { ...targetOption } : { option, votersCount: 0 };

        updatedOption.votersCount += 1;
        if (currentSendAs?.id === peerId || peerId === global.currentUserId) {
          updatedOption.isChosen = true;
        }

        if (targetOptionIndex) {
          newResults[targetOptionIndex] = updatedOption;
        } else {
          newResults.push(updatedOption);
        }
      });

      global = updateChatMessage(
        global,
        message.chatId,
        message.id,
        {
          content: {
            ...message.content,
            poll: {
              ...poll,
              results: {
                ...poll.results,
                recentVoterIds: newRecentVoterIds,
                totalVoters: newTotalVoters,
                results: newResults,
              },
            },
          },
        },
      );
      setGlobal(global);

      break;
    }

    case 'updateServiceNotification': {
      const { message } = update;

      if (selectIsServiceChatReady(global)) {
        actions.createServiceNotification({ message });
      }

      break;
    }

    case 'updateMessageReactions': {
      const { chatId, id, reactions } = update;
      const message = selectChatMessage(global, chatId, id);
      const chat = selectChat(global, update.chatId);

      if (!chat || !message) return;

      global = updateReactions(global, actions, chatId, id, reactions, chat, message.isOutgoing, message);
      setGlobal(global);
      break;
    }

    case 'updateMessageExtendedMedia': {
      const {
        chatId, id, media, preview,
      } = update;
      const message = selectChatMessage(global, chatId, id);
      const chat = selectChat(global, update.chatId);

      if (!chat || !message) return;

      if (preview) {
        if (!message.content.invoice) return;
        global = updateChatMessage(global, chatId, id, {
          content: {
            ...message.content,
            invoice: {
              ...message.content.invoice,
              extendedMedia: preview,
            },
          },
        });
        setGlobal(global);
      } else if (media) {
        global = updateChatMessage(global, chatId, id, {
          content: {
            ...media,
          },
        });
        setGlobal(global);
      }

      break;
    }

    case 'updateTranscribedAudio': {
      const { transcriptionId, text, isPending } = update;

      global = {
        ...global,
        transcriptions: {
          ...global.transcriptions,
          [transcriptionId]: {
            ...(global.transcriptions[transcriptionId] || {}),
            transcriptionId,
            text,
            isPending,
          },
        },
      };
      setGlobal(global);
      break;
    }

    case 'updateMessageSendFailed': {
      const { chatId, localId, error } = update;

      if (error.match(/CHAT_SEND_.+?FORBIDDEN/)) {
        Object.values(global.byTabId).forEach(({ id: tabId }) => {
          actions.showAllowedMessageTypesNotification({ chatId, tabId });
        });
      }

      global = updateChatMessage(global, chatId, localId, { sendingState: 'messageSendingStateFailed' });
      setGlobal(global);
      break;
    }

    case 'updateMessageTranslations': {
      const {
        chatId, messageIds, toLanguageCode, translations,
      } = update;

      global = updateMessageTranslations(global, chatId, messageIds, toLanguageCode, translations);

      setGlobal(global);
      break;
    }
  }
});

function updateReactions<T extends GlobalState>(
  global: T,
  actions: RequiredGlobalActions,
  chatId: string,
  id: number,
  reactions: ApiReactions,
  chat: ApiChat,
  isOutgoing?: boolean,
  message?: ApiMessage,
): T {
  const currentReactions = message?.reactions;

  // `updateMessageReactions` happens with an interval, so we try to avoid redundant global state updates
  if (currentReactions && areDeepEqual(reactions, currentReactions)) {
    return global;
  }

  global = updateChatMessage(global, chatId, id, { reactions });

  if (!isOutgoing) {
    return global;
  }

  const { reaction, isOwn, isUnread } = reactions.recentReactions?.[0] ?? {};
  const reactionEffectsEnabled = selectPerformanceSettingsValue(global, 'reactionEffects');
  if (reactionEffectsEnabled && message && reaction && isUnread && !isOwn) {
    const messageKey = getMessageKey(message);
    // Start reaction only in master tab
    actions.startActiveReaction({ containerId: messageKey, reaction, tabId: getCurrentTabId() });
  }

  const alreadyHasUnreadReaction = chat.unreadReactions?.includes(id);

  // Only notify about added reactions, not removed ones
  if (checkIfHasUnreadReactions(global, reactions) && !alreadyHasUnreadReaction) {
    global = updateUnreadReactions(global, chatId, {
      unreadReactionsCount: (chat?.unreadReactionsCount || 0) + 1,
      unreadReactions: [...(chat?.unreadReactions || []), id],
    });

    const newMessage = selectChatMessage(global, chatId, id);

    if (!chat || !newMessage) return global;

    onTickEnd(() => {
      notifyAboutMessage({
        chat,
        message: newMessage,
        isReaction: true,
      });
    });
  } else if (alreadyHasUnreadReaction) {
    global = updateUnreadReactions(global, chatId, {
      unreadReactionsCount: (chat?.unreadReactionsCount || 1) - 1,
      unreadReactions: chat?.unreadReactions?.filter((i) => i !== id),
    });
  }

  return global;
}

function updateWithLocalMedia(
  global: RequiredGlobalState, chatId: string, id: number, messageUpdate: Partial<ApiMessage>, isScheduled = false,
) {
  const currentMessage = isScheduled
    ? selectScheduledMessage(global, chatId, id)
    : selectChatMessage(global, chatId, id);

  // Preserve locally uploaded media.
  if (currentMessage && messageUpdate.content && !isLocalMessageId(id)) {
    const {
      photo, video, sticker, document,
    } = getMessageContent(currentMessage);

    if (photo && messageUpdate.content.photo) {
      messageUpdate.content.photo.blobUrl ??= photo.blobUrl;
      messageUpdate.content.photo.thumbnail ??= photo.thumbnail;
    } else if (video && messageUpdate.content.video) {
      messageUpdate.content.video.blobUrl ??= video.blobUrl;
    } else if (sticker && messageUpdate.content.sticker) {
      messageUpdate.content.sticker.isPreloadedGlobally ??= sticker.isPreloadedGlobally;
    } else if (document && messageUpdate.content.document) {
      messageUpdate.content.document.previewBlobUrl ??= document.previewBlobUrl;
    }
  }

  const newMessage = currentMessage ? { ...currentMessage, ...messageUpdate } : messageUpdate;

  return isScheduled
    ? updateScheduledMessage(global, chatId, id, newMessage)
    : updateChatMessage(global, chatId, id, newMessage);
}

function updateThreadUnread<T extends GlobalState>(
  global: T, actions: RequiredGlobalActions, message: ApiMessage, isDeleting?: boolean,
) {
  const { chatId } = message;

  const replyInfo = getMessageReplyInfo(message);

  const { threadInfo } = selectThreadByMessage(global, message) || {};

  if (!threadInfo && replyInfo?.replyToMsgId) {
    const originMessage = selectChatMessage(global, chatId, replyInfo.replyToMsgId);
    if (originMessage) {
      global = updateThreadUnreadFromForwardedMessage(global, originMessage, chatId, message.id, isDeleting);
    } else {
      actions.loadMessage({
        chatId,
        messageId: replyInfo.replyToMsgId,
        threadUpdate: {
          isDeleting,
          lastMessageId: message.id,
        },
      });
    }
  }

  return global;
}

function updateListedAndViewportIds<T extends GlobalState>(
  global: T, actions: RequiredGlobalActions, message: ApiMessage,
) {
  const { id, chatId } = message;

  const savedDialogId = selectSavedDialogIdFromMessage(global, message);

  const { threadInfo } = selectThreadByMessage(global, message) || {};

  const chat = selectChat(global, chatId);
  const isUnreadChatNotLoaded = chat?.unreadCount && !selectListedIds(global, chatId, MAIN_THREAD_ID);

  global = updateThreadUnread(global, actions, message);
  const { threadId } = threadInfo ?? { threadId: savedDialogId };

  if (threadId) {
    global = updateListedIds(global, chatId, threadId, [id]);

    Object.values(global.byTabId).forEach(({ id: tabId }) => {
      if (selectIsViewportNewest(global, chatId, threadId, tabId)) {
        // Always keep the first unread message in the viewport list
        const firstUnreadId = selectFirstUnreadId(global, chatId, threadId);
        const candidateGlobal = addViewportId(global, chatId, threadId, id, tabId);
        const newViewportIds = selectViewportIds(candidateGlobal, chatId, threadId, tabId);

        if (!firstUnreadId || newViewportIds!.includes(firstUnreadId)) {
          global = candidateGlobal;
        }
      }
    });

    if (threadInfo) {
      global = replaceThreadParam(global, chatId, threadId, 'threadInfo', {
        ...threadInfo,
        lastMessageId: message.id,
      });

      if (!isMessageLocal(message) && !isActionMessage(message)) {
        global = updateThreadInfo(global, chatId, threadId, {
          messagesCount: (threadInfo.messagesCount || 0) + 1,
        });
      }
    }
  }

  if (isUnreadChatNotLoaded) {
    return global;
  }

  global = updateListedIds(global, chatId, MAIN_THREAD_ID, [id]);

  Object.values(global.byTabId).forEach(({ id: tabId }) => {
    if (selectIsViewportNewest(global, chatId, MAIN_THREAD_ID, tabId)) {
      // Always keep the first unread message in the viewport list
      const firstUnreadId = selectFirstUnreadId(global, chatId, MAIN_THREAD_ID);
      const candidateGlobal = addViewportId(global, chatId, MAIN_THREAD_ID, id, tabId);
      const newViewportIds = selectViewportIds(candidateGlobal, chatId, MAIN_THREAD_ID, tabId);

      if (!firstUnreadId || newViewportIds!.includes(firstUnreadId)) {
        global = candidateGlobal;
      }
    }
  });

  return global;
}

function updateChatLastMessage<T extends GlobalState>(
  global: T,
  chatId: string,
  message: ApiMessage,
  force = false,
) {
  const { chats } = global;
  const chat = chats.byId[chatId];
  const currentLastMessageId = selectChatLastMessageId(global, chatId);

  const topic = chat?.isForum ? selectTopicFromMessage(global, message) : undefined;
  if (topic) {
    global = updateTopic(global, chatId, topic.id, {
      lastMessageId: message.id,
    });
  }

  const savedDialogId = selectSavedDialogIdFromMessage(global, message);
  if (savedDialogId) {
    global = updateChatLastMessageId(global, savedDialogId, message.id, 'saved');
  }

  if (currentLastMessageId && !force) {
    const isSameOrNewer = (
      currentLastMessageId === message.id || currentLastMessageId === message.previousLocalId
    ) || message.id > currentLastMessageId;

    if (!isSameOrNewer) {
      return global;
    }
  }

  global = updateChatLastMessageId(global, chatId, message.id);

  return global;
}

function findLastMessage<T extends GlobalState>(global: T, chatId: string, threadId: ThreadId = MAIN_THREAD_ID) {
  const byId = selectChatMessages(global, chatId);
  const listedIds = selectListedIds(global, chatId, threadId);

  if (!byId || !listedIds) {
    return undefined;
  }

  let i = listedIds.length;
  while (i--) {
    const message = byId[listedIds[i]];
    if (message && !message.isDeleting) {
      return message;
    }
  }

  return undefined;
}

export function deleteThread<T extends GlobalState>(
  global: T,
  chatId: string,
  threadId: ThreadId,
  actions: RequiredGlobalActions,
) {
  const byId = selectChatMessages(global, chatId);
  if (!byId) {
    return;
  }

  const messageIds = Object.values(byId).filter((message) => {
    const messageThreadId = selectThreadIdFromMessage(global, message);
    return messageThreadId === threadId;
  }).map((message) => message.id);

  if (!messageIds.length) {
    return;
  }

  deleteMessages(global, chatId, messageIds, actions);
}

export function deleteMessages<T extends GlobalState>(
  global: T, chatId: string | undefined, ids: number[], actions: RequiredGlobalActions,
) {
  // Channel update

  if (chatId) {
    const chat = selectChat(global, chatId);
    if (!chat) return;

    const threadIdsToUpdate = new Set<ThreadId>();
    threadIdsToUpdate.add(MAIN_THREAD_ID);

    ids.forEach((id) => {
      global = updateChatMessage(global, chatId, id, {
        isDeleting: true,
      });

      if (chat.topics?.[id]) {
        global = deleteTopic(global, chatId, id);
      }

      const message = selectChatMessage(global, chatId, id);
      if (!message) {
        return;
      }

      global = updateThreadUnread(global, actions, message, true);

      const threadId = selectThreadIdFromMessage(global, message);
      if (threadId) {
        threadIdsToUpdate.add(threadId);
      }
    });

    actions.requestChatUpdate({ chatId });

    const idsSet = new Set(ids);

    threadIdsToUpdate.forEach((threadId) => {
      const threadInfo = selectThreadInfo(global, chatId, threadId);
      if (!threadInfo?.lastMessageId || !idsSet.has(threadInfo.lastMessageId)) return;

      const newLastMessage = findLastMessage(global, chatId, threadId);
      if (!newLastMessage) return;

      if (threadId === MAIN_THREAD_ID) {
        global = updateChatLastMessage(global, chatId, newLastMessage, true);
      }

      global = updateThreadInfo(global, chatId, threadId, {
        lastMessageId: newLastMessage.id,
      });

      if (chat.isForum) {
        global = updateTopic(global, chatId, Number(threadId), {
          lastMessageId: newLastMessage.id,
        });
      }
    });

    setGlobal(global);

    setTimeout(() => {
      global = getGlobal();
      global = deleteChatMessages(global, chatId, ids);
      setGlobal(global);
    }, ANIMATION_DELAY);

    return;
  }

  // Common box update

  const chatsIdsToUpdate: string[] = [];

  ids.forEach((id) => {
    const commonBoxChatId = selectCommonBoxChatId(global, id);
    if (commonBoxChatId) {
      chatsIdsToUpdate.push(commonBoxChatId);

      global = updateChatMessage(global, commonBoxChatId, id, {
        isDeleting: true,
      });

      const newLastMessage = findLastMessage(global, commonBoxChatId);
      if (newLastMessage) {
        global = updateChatLastMessage(global, commonBoxChatId, newLastMessage, true);
      }

      const message = selectChatMessage(global, commonBoxChatId, id);
      if (selectIsChatWithSelf(global, commonBoxChatId) && message) {
        const threadId = selectThreadIdFromMessage(global, message);
        if (getIsSavedDialog(commonBoxChatId, threadId, global.currentUserId)) {
          const newLastSavedDialogMessage = findLastMessage(global, commonBoxChatId, threadId);
          actions.requestSavedDialogUpdate({ chatId: String(threadId) });
          if (newLastSavedDialogMessage) {
            global = updateChatLastMessageId(global, commonBoxChatId, newLastSavedDialogMessage.id, 'saved');
          }
        }
      }

      setTimeout(() => {
        global = getGlobal();
        global = deleteChatMessages(global, commonBoxChatId, [id]);
        setGlobal(global);
      }, ANIMATION_DELAY);
    }
  });

  setGlobal(global);

  unique(chatsIdsToUpdate).forEach((id) => {
    actions.requestChatUpdate({ chatId: id });
  });
}

function deleteScheduledMessages<T extends GlobalState>(
  chatId: string | undefined, ids: number[], actions: RequiredGlobalActions, global: T,
) {
  if (!chatId) {
    return;
  }

  ids.forEach((id) => {
    global = updateScheduledMessage(global, chatId, id, {
      isDeleting: true,
    });
  });

  setGlobal(global);

  setTimeout(() => {
    global = getGlobal();
    global = deleteChatScheduledMessages(global, chatId, ids);
    const scheduledMessages = selectChatScheduledMessages(global, chatId);
    global = replaceThreadParam(
      global, chatId, MAIN_THREAD_ID, 'scheduledIds', Object.keys(scheduledMessages || {}).map(Number),
    );
    setGlobal(global);
  }, ANIMATION_DELAY);
}
