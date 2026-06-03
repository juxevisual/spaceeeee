import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useNotes(user) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const addNote = useCallback(async ({ content, color, type }) => {
    const { error } = await supabase.from('notes').insert({
      user_id: user.id,
      content: content.trim(),
      color: color || 'default',
      type: type || 'text',
    })
    if (!error) fetchNotes()
    return { error }
  }, [user, fetchNotes])

  const updateNote = useCallback(async (id, updates) => {
    const { error } = await supabase
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) fetchNotes()
    return { error }
  }, [fetchNotes])

  const deleteNote = useCallback(async (id) => {
    const { error } = await supabase.from('notes').delete().eq('id', id)
    if (!error) fetchNotes()
    return { error }
  }, [fetchNotes])

  const togglePin = useCallback(async (id, currentPinned) => {
    return updateNote(id, { pinned: !currentPinned })
  }, [updateNote])

  const archiveNote = useCallback(async (id, currentArchived) => {
    return updateNote(id, { archived: !currentArchived, pinned: false })
  }, [updateNote])

  const toggleReaction = useCallback(async (noteId, currentReactions, userId, reactionKey) => {
    const updated = { ...(currentReactions || {}) }
    if (updated[userId] === reactionKey) {
      delete updated[userId]
    } else {
      updated[userId] = reactionKey
    }
    return updateNote(noteId, { reactions: updated })
  }, [updateNote])

  return { notes, loading, addNote, updateNote, deleteNote, togglePin, archiveNote, toggleReaction }
}
