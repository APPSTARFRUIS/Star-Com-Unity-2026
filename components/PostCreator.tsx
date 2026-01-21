
import React, { useState, useRef } from 'react';
import { CATEGORIES } from '../constants';
import { geminiService } from '../geminiService';
import { Post, User, Attachment } from '../types';

interface PostCreatorProps {
  currentUser: User;
  onPostCreated: (post: Omit<Post, 'id' | 'likes' | 'comments' | 'createdAt' | 'userName' | 'userAvatar' | 'role' | 'userId'>) => void;
}

const PostCreator: React.FC<PostCreatorProps> = ({ currentUser, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showFullCreator, setShowFullCreator] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    onPostCreated({ title, content, category, attachments: attachments.length > 0 ? attachments : undefined });
    setTitle('');
    setContent('');
    setAttachments([]);
    setShowFullCreator(false);
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
    
    setAttachments([...attachments, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleAiRefine = async () => {
    if (!content) return;
    setIsAiLoading(true);
    try {
      const refined = await geminiService.refinePostContent(content);
      setContent(refined);
      if (!title) {
        const generatedTitle = await geminiService.generatePostTitle(refined);
        setTitle(generatedTitle);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'Collègue';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-8">
      {!showFullCreator ? (
        <div className="flex items-center gap-4">
          <img src={currentUser.avatar} className="w-10 h-10 rounded-full" alt="" />
          <button 
            onClick={() => setShowFullCreator(true)}
            className="flex-1 text-left bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Quoi de neuf, {firstName} ?
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Nouvelle Publication</h3>
            <button type="button" onClick={() => setShowFullCreator(false)} className="text-slate-400 hover:text-slate-600">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              required
            />
            
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Partagez quelque chose avec votre équipe..."
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                required
              />
              <button
                type="button"
                onClick={handleAiRefine}
                disabled={isAiLoading || !content}
                className="absolute right-3 bottom-3 flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {isAiLoading ? (
                   <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                Affinage par IA
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-3 py-2">
                {attachments.map((file, idx) => (
                  <div key={idx} className="relative w-20 h-20 group border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                    {file.type.startsWith('image/') ? (
                      <img src={file.data} className="w-full h-full object-cover" alt="" />
                    ) : file.type.startsWith('video/') ? (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 p-2 text-center text-[10px]">
                        {file.name}
                      </div>
                    )}
                    <button 
                      type="button" 
                      onClick={() => removeAttachment(idx)}
                      className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="pt-5">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  multiple 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  Charger des fichiers
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md active:scale-95"
            >
              Publier
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PostCreator;
