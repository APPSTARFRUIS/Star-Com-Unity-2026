
import React, { useState, useMemo, useRef } from 'react';
import { User, DocumentFile, UserRole } from '../types';

interface DocumentsViewProps {
  currentUser: User;
  documents: DocumentFile[];
  categories: string[];
  onUpload: (name: string, type: string, size: number, category: string, data: string) => void;
  onDelete: (id: string) => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ currentUser, documents, categories, onUpload, onDelete }) => {
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState(categories[0] || 'Général');

  const docCategoriesForFilter = useMemo(() => ['Tous', ...categories], [categories]);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesCategory = selectedCategory === 'Tous' || doc.category === selectedCategory;
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [documents, selectedCategory, searchQuery]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onUpload(
        file.name,
        file.type,
        file.size,
        uploadCategory,
        reader.result as string
      );
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleViewDocument = (doc: DocumentFile) => {
    // Création d'une nouvelle fenêtre
    const newWindow = window.open('', '_blank');
    if (!newWindow) {
      alert("Le bloqueur de fenêtres surgissantes empêche l'ouverture du document.");
      return;
    }

    const base64Data = doc.data;
    const contentType = base64Data.split(';base64,')[0].split(':')[1];

    // Pour PDF et Images, on injecte un conteneur pour forcer l'affichage
    if (contentType.includes('pdf') || contentType.includes('image')) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${doc.name}</title>
            <style>
              body { margin: 0; padding: 0; background: #525659; display: flex; justify-content: center; align-items: center; height: 100vh; overflow: hidden; }
              embed, iframe { width: 100%; height: 100%; border: none; }
            </style>
          </head>
          <body>
            <embed src="${base64Data}" type="${contentType}">
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      // Pour les autres types (Word, Excel, PPT), on redirige vers l'URL de données
      // Le navigateur gérera le téléchargement depuis ce nouvel onglet
      newWindow.location.href = base64Data;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string, name: string) => {
    const fileName = name.toLowerCase();
    
    if (type.includes('pdf')) return (
      <div className="p-2 bg-red-50 text-red-600 rounded-lg">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6l-4-4H9z" /><path d="M5 6a2 2 0 012-2h1v10H5V6z" /></svg>
      </div>
    );
    if (type.includes('image')) return (
      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
      </div>
    );
    if (type.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return (
      <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      </div>
    );
    if (type.includes('excel') || type.includes('spreadsheet') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return (
      <div className="p-2 bg-green-50 text-green-700 rounded-lg border border-green-100">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      </div>
    );
    if (type.includes('presentation') || type.includes('powerpoint') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return (
      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg border border-orange-100">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
      </div>
    );
    if (type.includes('video')) return (
      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm10 2l4-2v6l-4-2V8z" /></svg>
      </div>
    );
    return (
      <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
      </div>
    );
  };

  const canManageGlobal = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR;

  return (
    <div className="max-w-6xl mx-auto flex gap-8 animate-in fade-in duration-500">
      {/* Sidebar Filters */}
      <aside className="w-64 flex-shrink-0 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Documents</h2>
          <div className="space-y-1">
            {docCategoriesForFilter.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === cat 
                    ? 'bg-[#14532d] text-white shadow-md' 
                    : 'text-slate-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                {cat}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {cat === 'Tous' ? documents.length : documents.filter(d => d.category === cat).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ajouter un fichier</h3>
          <div className="space-y-3">
            <select 
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-green-500 outline-none"
            >
              {categories.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Téléverser
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-6">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Rechercher un document par nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm"
          />
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Document</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Taille</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="cursor-pointer" onClick={() => handleViewDocument(doc)}>
                        {getFileIcon(doc.type, doc.name)}
                      </div>
                      <div className="overflow-hidden">
                        <button 
                          onClick={() => handleViewDocument(doc)}
                          className="text-sm font-bold text-slate-800 truncate block hover:text-green-700 transition-colors text-left w-full" 
                          title={doc.name}
                        >
                          {doc.name}
                        </button>
                        <p className="text-[10px] text-slate-400">Par {doc.uploadedByName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-green-50 text-green-700 border-green-100">
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                    {formatSize(doc.size)}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <button 
                        onClick={() => handleViewDocument(doc)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Visualiser"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <a 
                        href={doc.data} 
                        download={doc.name}
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="Télécharger"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </a>
                      {(canManageGlobal || doc.uploadedBy === currentUser.id) && (
                        <button 
                          onClick={() => onDelete(doc.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                    Aucun document trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default DocumentsView;
