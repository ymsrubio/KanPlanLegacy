// src/components/KanbanBoard.jsx
import React, { useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard.jsx';

export default function KanbanBoard() {
  const [columns, setColumns] = useState([
    { id: 1, name: 'Backlog', wip_limit: null },
    { id: 2, name: 'Ready to Start', wip_limit: 3 },
    { id: 3, name: 'In Progress', wip_limit: 2 },
    { id: 4, name: 'Done', wip_limit: null }
  ]);

  const [tasks, setTasks] = useState([
    { id: 101, column_id: 1, title: 'Explore Cloudflare D1', description: 'Setup local wrangler DB', is_urgent: 0, is_important: 1 },
    { id: 102, column_id: 2, title: 'Fix Express Endpoint', description: 'Resolve WIP limit bug', is_urgent: 1, is_important: 1 },
    { id: 103, column_id: 2, title: 'Time-block Calendar', description: 'Add drag and drop grid', is_urgent: 0, is_important: 1 }
  ]);

  // Alert toast message state
  const [alert, setAlert] = useState(null);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskColumnId, setNewTaskColumnId] = useState(1);
  const [isUrgent, setIsUrgent] = useState(0);
  const [isImportant, setIsImportant] = useState(1);

  // Column editing state
  const [editingColId, setEditingColId] = useState(null);
  const [editWipLimit, setEditWipLimit] = useState('');

  const showAlert = (msg) => {
    setAlert(msg);
    setTimeout(() => setAlert(null), 4000);
  };

  // Handle Drag & Drop with Hard WIP Rejection
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside a valid droppable
    if (!destination) return;

    const sourceColId = Number(source.droppableId);
    const destColId = Number(destination.droppableId);

    // No move occurred
    if (sourceColId === destColId && source.index === destination.index) return;

    const destCol = columns.find((c) => c.id === destColId);
    const currentDestTasks = tasks.filter((t) => t.column_id === destColId);

    // Hard WIP Limit Validation when moving to a DIFFERENT column
    if (sourceColId !== destColId && destCol && destCol.wip_limit !== null) {
      if (currentDestTasks.length >= destCol.wip_limit) {
        showAlert(`⚠️ WIP Limit Reached! Cannot move task into "${destCol.name}" (Max Capacity: ${destCol.wip_limit}). Please move a task back to Backlog first!`);
        return; // REJECT MOVE
      }
    }

    // Apply move
    const updatedTasks = tasks.map((t) => {
      if (t.id === Number(draggableId)) {
        return { ...t, column_id: destColId };
      }
      return t;
    });

    setTasks(updatedTasks);
  };

  // Add Task
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const targetCol = columns.find((c) => c.id === Number(newTaskColumnId));
    const currentTasks = tasks.filter((t) => t.column_id === Number(newTaskColumnId));

    if (targetCol && targetCol.wip_limit !== null && currentTasks.length >= targetCol.wip_limit) {
      showAlert(`⚠️ Cannot add task to "${targetCol.name}". WIP limit of ${targetCol.wip_limit} reached!`);
      return;
    }

    const newTask = {
      id: Date.now(),
      column_id: Number(newTaskColumnId),
      title: newTaskTitle,
      description: '',
      is_urgent: isUrgent,
      is_important: isImportant
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  // Save Column WIP Limit
  const handleSaveWipLimit = (colId) => {
    const limit = editWipLimit === '' ? null : Number(editWipLimit);
    setColumns(columns.map((c) => (c.id === colId ? { ...c, wip_limit: limit } : c)));
    setEditingColId(null);
  };

  return (
    <div style={{ padding: '8px' }}>
      {/* Alert Notification Toast */}
      {alert && (
        <div
          style={{
            background: '#fee2e2',
            borderLeft: '4px solid #ef4444',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontWeight: '500',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          {alert}
        </div>
      )}

      {/* Add Task Quick Bar */}
      <form
        onSubmit={handleAddTask}
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          background: '#ffffff',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          placeholder="Enter task title..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            outline: 'none'
          }}
        />
        <select
          value={newTaskColumnId}
          onChange={(e) => setNewTaskColumnId(e.target.value)}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        >
          {columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.wip_limit ? `(Max: ${c.wip_limit})` : ''}
            </option>
          ))}
        </select>
        <label style={{ fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="checkbox"
            checked={isUrgent === 1}
            onChange={(e) => setIsUrgent(e.target.checked ? 1 : 0)}
          />
          Urgent
        </label>
        <label style={{ fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="checkbox"
            checked={isImportant === 1}
            onChange={(e) => setIsImportant(e.target.checked ? 1 : 0)}
          />
          Important
        </label>
        <button
          type="submit"
          style={{
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          + Add Task
        </button>
      </form>

      {/* Drag and Drop Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.column_id === col.id);
            const isFull = col.wip_limit !== null && colTasks.length >= col.wip_limit;

            return (
              <Droppable key={col.id} droppableId={String(col.id)}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      background: snapshot.isDraggingOver ? '#f1f5f9' : '#f8fafc',
                      borderRadius: '10px',
                      padding: '16px',
                      minWidth: '260px',
                      width: '260px',
                      border: isFull ? '2px solid #f87171' : '1px solid #e2e8f0',
                      transition: 'background 0.2s, border 0.2s'
                    }}
                  >
                    {/* Header with WIP limit edit option */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ margin: 0, fontSize: '1em', color: '#0f172a', fontWeight: '700' }}>
                        {col.name}{' '}
                        <span
                          style={{
                            fontSize: '0.85em',
                            fontWeight: '600',
                            color: isFull ? '#dc2626' : '#64748b'
                          }}
                        >
                          ({colTasks.length}/{col.wip_limit ?? '∞'})
                        </span>
                      </h3>

                      {editingColId === col.id ? (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input
                            type="number"
                            placeholder="Limit"
                            value={editWipLimit}
                            onChange={(e) => setEditWipLimit(e.target.value)}
                            style={{ width: '50px', padding: '2px 4px', fontSize: '0.8em' }}
                          />
                          <button onClick={() => handleSaveWipLimit(col.id)} style={{ fontSize: '0.75em' }}>Save</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingColId(col.id);
                            setEditWipLimit(col.wip_limit ?? '');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '0.8em',
                            cursor: 'pointer'
                          }}
                          title="Edit WIP limit"
                        >
                          ⚙️
                        </button>
                      )}
                    </div>

                    {/* Droppable Task Cards Container */}
                    <div style={{ minHeight: '150px' }}>
                      {colTasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
