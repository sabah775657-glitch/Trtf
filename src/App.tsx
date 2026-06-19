import { useState } from 'react'
import { Plus, Trash2, Search } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  date: string
}

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const addNote = () => {
    if (title.trim() && content.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        title,
        content,
        date: new Date().toLocaleDateString('ar-SA'),
      }
      setNotes([newNote, ...notes])
      setTitle('')
      setContent('')
    }
  }

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id))
  }

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          UnNoted - الدفتر الذكي
        </h1>

        {/* Add Note Section */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8 shadow-lg">
          <input
            type="text"
            placeholder="عنوان الملاحظة"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-700 text-white rounded px-4 py-2 mb-4 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            placeholder="محتوى الملاحظة..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-slate-700 text-white rounded px-4 py-2 mb-4 h-24 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            onClick={addNote}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 transition-all"
          >
            <Plus size={20} />
            إضافة ملاحظة
          </button>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="ابحث عن الملاحظات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 text-white rounded px-4 py-2 pl-10 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Notes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.length > 0 ? (
            filteredNotes.map(note => (
              <div key={note.id} className="bg-slate-800 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold text-blue-400">{note.title}</h2>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <p className="text-slate-300 mb-2">{note.content}</p>
                <p className="text-sm text-slate-500">{note.date}</p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-slate-400">
              لا توجد ملاحظات
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App