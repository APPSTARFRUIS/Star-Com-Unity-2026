
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Message, Attachment } from '../types';

interface MessagesViewProps {
  currentUser: User;
  users: User[];
  messages: Message[];
  onSendMessage: (receiverId: string, text: string, attachments?: Attachment[]) => void;
}

const MessagesView: React.FC<MessagesViewProps> = ({ currentUser, users, messages, onSendMessage }) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const contacts = useMemo(() => {
    return users.filter(u => u.id !== currentUser.id && 
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
       u.department.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [users, currentUser, searchQuery]);

  const selectedUser = useMemo(() => 
    users.find(u => u.id === selectedUserId), [users, selectedUserId]
  );

  const conversation = useMemo(() => {
    if (!selectedUserId) return [];
    return messages.filter(m => 
      (m.senderId === currentUser.id && m.receiverId === selectedUserId) ||
      (m.senderId === selectedUserId && m.receiverId === currentUser.id)
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages, selectedUserId, currentUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      
      const promise = new Promise<Attachment>((resolve) => {
        reader.onloadend = () => {
          resolve({
            name: file.name,
            type: file.type,
            data: reader.result as string
          });
        };
      });
      
      reader.readAsDataURL(file);
      newAttachments.push(await promise);
    }
    
    setPendingAttachments([...pendingAttachments, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingAttachment = (index: number) => {
    setPendingAttachments(pendingAttachments.filter((_, i) => i !== index));
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && pendingAttachments.length === 0) || !selectedUserId) return;
    
    onSendMessage(selectedUserId, messageText, pendingAttachments.length > 0 ? pendingAttachments : undefined);
    setMessageText('');
    setPendingAttachments([]);
  };

  const handleNewDiscussion = () => {
    setSelectedUserId(null);
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const isImage = (file: Attachment) => file.type.startsWith('image/');

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-160px)] flex bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-100 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Messages</h2>
            <button 
              onClick={handleNewDiscussion}
              className="p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl transition-all active:scale-95 group"
              title="Nouvelle discussion"
            >
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Rechercher un collègue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-green-500 transition-all outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {contacts.map(user => {
            const lastMsg = messages
              .filter(m => (m.senderId === user.id && m.receiverId === currentUser.id) || (m.senderId === currentUser.id && m.receiverId === user.id))
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            return (
              <button
                key={user.id}
                onClick={() => setSelectedUserId(user.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                  selectedUserId === user.id ? 'bg-white shadow-sm border border-slate-100 ring-1 ring-black/5' : 'hover:bg-white/50'
                }`}
              >
                <div className="relative">
                  <img src={user.avatar} className="w-12 h-12 rounded-full border border-slate-200" alt="" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{user.name}</h4>
                    {lastMsg && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-green-600 font-medium truncate mb-0.5">{user.department}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {lastMsg ? lastMsg.text || "Fichier envoyé" : "Démarrer une discussion"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={selectedUser.avatar} className="w-10 h-10 rounded-full" alt="" />
                <div>
                  <h3 className="font-bold text-slate-800">{selectedUser.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-slate-400 font-medium">En ligne</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </button>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
              </div>
            </div>

            {/* Messages Content */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30"
            >
              <div className="text-center py-8">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                  Début de la conversation
                </span>
              </div>

              {conversation.map(message => {
                const isMine = message.senderId === currentUser.id;
                return (
                  <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] group flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                        isMine 
                          ? 'bg-[#14532d] text-white rounded-br-none' 
                          : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                      }`}>
                        {message.text}
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className={`mt-2 flex flex-col gap-2`}>
                            {message.attachments.map((att, i) => (
                              <div key={i} className="max-w-xs overflow-hidden rounded-lg border border-white/20">
                                {isImage(att) ? (
                                  <img src={att.data} alt={att.name} className="w-full h-auto cursor-pointer" onClick={() => window.open(att.data, '_blank')} />
                                ) : (
                                  <div className={`flex items-center gap-2 p-2 ${isMine ? 'bg-white/10' : 'bg-slate-50'}`}>
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    <span className="text-xs truncate">{att.name}</span>
                                    <a href={att.data} download={att.name} className="ml-auto text-blue-400 hover:text-blue-300">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </a>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className={`text-[10px] mt-1 font-medium text-slate-400`}>
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
              {/* Attachments Preview */}
              {pendingAttachments.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2 px-2">
                  {pendingAttachments.map((att, idx) => (
                    <div key={idx} className="relative w-16 h-16 group bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      {isImage(att) ? (
                        <img src={att.data} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                      <button 
                        type="button" 
                        onClick={() => removePendingAttachment(idx)}
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  multiple 
                  className="hidden" 
                />
                <button 
                  type="button" 
                  onClick={handleFileClick}
                  className="p-2 text-slate-400 hover:text-[#14532d] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
                <input 
                  type="text" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 bg-slate-100 border-transparent rounded-2xl px-5 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-green-500 transition-all outline-none"
                />
                <button 
                  type="submit"
                  disabled={!messageText.trim() && pendingAttachments.length === 0}
                  className="p-3 bg-[#14532d] text-white rounded-2xl hover:bg-green-800 transition-all shadow-md shadow-green-900/10 disabled:opacity-50 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/30">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Sélectionnez une discussion</h3>
            <p className="text-slate-400 mt-2 max-w-xs">Choisissez un collaborateur dans la liste pour commencer à échanger en privé.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesView;
