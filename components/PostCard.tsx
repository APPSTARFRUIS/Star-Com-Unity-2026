
import React, { useState } from 'react';
import { Post, UserRole, Attachment } from '../types';

interface PostCardProps {
  post: Post;
  currentUserRole: UserRole;
  currentUserId: string;
  onDelete: (id: string) => void;
  onLike: (id: string) => void;
  onAddComment: (postId: string, text: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUserRole, currentUserId, onDelete, onLike, onAddComment }) => {
  const [commentText, setCommentText] = useState('');
  const canDelete = currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.MODERATOR || post.userId === currentUserId;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
  };

  const isImage = (file: Attachment) => {
    return file.type.startsWith('image/') || 
           /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
  };

  const isVideo = (file: Attachment) => {
    return file.type.startsWith('video/') || 
           /\.(mp4|webm|ogg|mov)$/i.test(file.name);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="p-5 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-full border border-slate-100" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{post.userName}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                post.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 
                post.role === UserRole.MODERATOR ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {post.role}
              </span>
            </div>
            <p className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString('fr-FR')} • {post.category}</p>
          </div>
        </div>
        {canDelete && (
          <button onClick={() => onDelete(post.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-5 pb-4">
        <h2 className="text-xl font-bold text-slate-900 mb-2">{post.title}</h2>
        <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>

      {/* Attachments Grid */}
      {post.attachments && post.attachments.length > 0 && (
        <div className={`w-full bg-slate-50 border-y border-slate-100 grid ${
          post.attachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
        } gap-px`}>
          {post.attachments.map((file, idx) => (
            <div key={idx} className="relative group bg-white flex items-center justify-center overflow-hidden min-h-[200px]">
              {isImage(file) ? (
                <img 
                  src={file.data} 
                  className="w-full h-full object-cover max-h-[500px] cursor-pointer hover:scale-[1.02] transition-transform duration-500" 
                  alt={file.name} 
                  onClick={() => window.open(file.data, '_blank')}
                />
              ) : isVideo(file) ? (
                <video controls className="w-full max-h-[500px] bg-black">
                  <source src={file.data} type={file.type} />
                </video>
              ) : (
                <div className="p-8 w-full flex flex-col items-center justify-center gap-4 text-center bg-slate-50">
                   <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-blue-600">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                   </div>
                   <div className="space-y-1 overflow-hidden w-full px-4">
                      <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                      <a 
                        href={file.data} 
                        download={file.name}
                        className="inline-block mt-2 text-xs text-blue-600 font-bold hover:underline bg-blue-50 px-3 py-1 rounded-full"
                      >
                        Télécharger
                      </a>
                   </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-6">
        <button onClick={() => onLike(post.id)} className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors group">
          <svg className="w-5 h-5 group-active:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.757c1.246 0 2.25 1.004 2.25 2.25 0 .428-.12.828-.328 1.168L18.328 19c-.35.568-.973.918-1.642.918H10a1 1 0 01-1-1v-8a1 1 0 01.316-.727l5-5V2.422a1 1 0 011.664-.746l3.328 3.125a1 1 0 010 1.442L14.316 9.273A1 1 0 0114 10z" />
          </svg>
          <span className="font-bold text-sm">{post.likes}</span>
        </button>
        <div className="flex items-center gap-2 text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="font-bold text-sm">{post.comments.length}</span>
        </div>
      </div>

      {/* Comments List */}
      {post.comments.length > 0 && (
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-4">
          {post.comments.map(comment => (
            <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <img src={comment.userAvatar} className="w-8 h-8 rounded-full border border-slate-200" alt="" />
              <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-slate-900">{comment.userName}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{new Date(comment.createdAt).toLocaleTimeString('fr-FR')}</span>
                </div>
                <p className="text-sm text-slate-700">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Comment Input */}
      <form onSubmit={handleSubmitComment} className="p-4 border-t border-slate-100 flex gap-2 bg-white">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Écrire un commentaire..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
        />
        <button 
          type="submit"
          disabled={!commentText.trim()}
          className="bg-blue-600 text-white rounded-full p-2.5 disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-sm active:scale-95 flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default PostCard;
