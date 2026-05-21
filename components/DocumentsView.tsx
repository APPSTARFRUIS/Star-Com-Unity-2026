```tsx
import React, { useState, useMemo, useRef } from 'react';
import { User, DocumentFile, UserRole } from '../types';

interface DocumentsViewProps {
  currentUser: User;
  documents: DocumentFile[];
  categories: string[];
  onUpload: (name: string, type: string, size: number, category: string, data: string) => void;
  onDelete: (id: string) => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({
  currentUser,
  documents,
  categories,
  onUpload,
  onDelete,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState(categories[0] || 'Général');

  const docCategoriesForFilter = useMemo(() => ['Tous', ...categories], [categories]);

  const filteredDocs = useMemo(() => {
    return documents
      .filter((doc) => {
        const matchesCategory =
          selectedCategory === 'Tous' || doc.category === selectedCategory;

        const matchesSearch = doc.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
      })
      .sort(
        (a, b) =>
          new Date(b.uploadedAt).getTime() -
          new Date(a.uploadedAt).getTime()
      );
  }, [documents, selectedCategory, searchQuery]);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

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
    const contentType = doc.data
      .split(';base64,')[0]
      .split(':')[1];

    if (
      contentType.includes('pdf') ||
      contentType.includes('image')
    ) {
      setPreviewDocument(doc);
      return;
    }

    const link = document.createElement('a');
    link.href = doc.data;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadDocument = (doc: DocumentFile) => {
    const link = document.createElement('a');
    link.href = doc.data;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(1)) +
      ' ' +
      sizes[i]
    );
  };

  const formatDate = (date: string) => {
    if (!date) return '-';

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) return '-';

    return parsedDate.toLocaleDateString('fr-FR');
  };

  const getFileIcon = (type: string, name: string) => {
    const fileName = name.toLowerCase();

    if (type.includes('pdf')) {
      return (
        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6l-4-4H9z" />
            <path d="M5 6a2 2 0 012-2h1v10H5V6z" />
          </svg>
        </div>
      );
    }

    if (type.includes('image')) {
      return (
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2a1 1 0 100 2 1 1 0 000-2zm8 8l-3-3-2 2-1-1-3 3h9z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    }

    if (
      fileName.endsWith('.doc') ||
      fileName.endsWith('.docx')
    ) {
      return (
        <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H4z" />
          </svg>
        </div>
      );
    }

    return (
      <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8l-6-6H4z" />
        </svg>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {docCategoriesForFilter.map((category) => {
              const count =
                category === 'Tous'
                  ? documents.length
                  : documents.filter((d) => d.category === category)
                      .length;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                    selectedCategory === category
                      ? 'bg-green-800 text-white'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{category}</span>
                  <span className="text-xs opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          {(currentUser.role === UserRole.ADMIN ||
            currentUser.role === UserRole.MODERATOR) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-4">
              <h3 className="font-semibold text-slate-700">
                Ajouter un fichier
              </h3>

              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg py-3 font-medium transition-colors"
              >
                {isUploading ? 'Téléversement...' : 'Téléverser'}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-3"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 text-left text-sm text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-4">Document</th>
                  <th className="px-6 py-4">Catégorie</th>
                  <th className="px-6 py-4">Taille</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {getFileIcon(doc.type, doc.name)}

                        <div>
                          <div className="font-medium text-slate-800">
                            {doc.name}
                          </div>
                          <div className="text-sm text-slate-500">
                            Par {doc.uploadedByName}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                        {doc.category}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {formatSize(doc.size)}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(doc.uploadedAt)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleViewDocument(doc)}
                          className="text-slate-500 hover:text-green-600"
                        >
                          👁️
                        </button>

                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="text-slate-500 hover:text-blue-600"
                        >
                          ⬇️
                        </button>

                        {(currentUser.role === UserRole.ADMIN ||
                          currentUser.role === UserRole.MODERATOR) && (
                          <button
                            onClick={() => onDelete(doc.id)}
                            className="text-slate-500 hover:text-red-600"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {previewDocument && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] overflow-hidden relative">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-800">
                {previewDocument.name}
              </h2>

              <button
                onClick={() => setPreviewDocument(null)}
                className="text-slate-500 hover:text-red-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="w-full h-full bg-slate-100">
              {previewDocument.type.includes('pdf') ? (
                <iframe
                  src={previewDocument.data}
                  title={previewDocument.name}
                  className="w-full h-full"
                />
              ) : (
                <img
                  src={previewDocument.data}
                  alt={previewDocument.name}
                  className="max-w-full max-h-full mx-auto object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsView;
```
