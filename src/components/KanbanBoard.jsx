// src/components/KanbanBoard.jsx
import React, { useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard.jsx';

export default function KanbanBoard({ tasks, setTasks }) {
  const [columns, setColumns] = useState([
    { id: 1, name: 'Backlog', wip_limit: null },
    { id: 2, name: 'Ready to Start', wip_limit: 3 },
    { id: 3, name: 'In Progress', wip_limit: 2 },
    { id: 4, name: 'Done', wip_limit: null }
  ]);

  const [alert, setAlert] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskColumnId, setNewTaskColumnId] = useState(1);
  const [isUrgent, setIsUrgent] = useState(0);
  const [isImportant, setIsImportant] = useState(1);
  const [editingColId, setEditingColId] = useState(null);
  const [editWipLimit, setEditWipLimit] = useState('');

  const showAlert = (msg) => {
    setAlert(msg);
    setTimeout(() => setAlert(null), 4000);
  };

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceColId = Number(source.droppableId);
    const destColId = Number(destination.droppableId);
    if (sourceColId === destColId && source.index === destination.index) return;

    const destCol = columns.find((c) => c.id === destColId);
    const currentDestTasks = tasks.filter((t) => t.column_id === destColId);

    if (sourceColId !== destColId && destCol && destCol.wip_limit !== null) {
      if (currentDestTasks.length >= destCol.wip_limit) {
        showAlert(`⚠️ WIP Limit Reached! Cannot move task into "${destCol.name}" (Max: ${destCol.wip_limit}).`);
        return;
      }
    }

    const updatedTasks = tasks.map((t) => (t.id === Number(draggableId) ? { ...t, column_id: destColId } : t));
    setTasks(updatedTasks);
  };

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

  const handleSaveWipLimit = (colId) => {
    const limit = editWipLimit === '' ? null : Number(editWipLimit);
    setColumns(columns.map((c) => (c.id === colId ? { ...c, wip_limit: limit } : c)));
    setEditingColId(null);
  };

  return (
    <div style={{ padding: '0px' }}>
      {/* Alert Notification Toast */}
      {alert && (
        <div
          style={{
            background: '#fff1f2',
            borderLeft: '4px solid #ff4f00',
            color: '#201515',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontWeight: '600',
            fontSize: '0.9em'
          }}
        >
          {alert}
        </div>
      )}

      {/* Add Task Bar */}
      <form
        onSubmit={handleAddTask}
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          background: '#f8f4f0',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid #c5c0b1',
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          placeholder="Enter new task..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #c5c0b1',
            outline: 'none',
            fontSize: '0.95em',
            color: '#201515',
            background: '#fffefb'
          }}
        />
        <select
          value={newTaskColumnId}
          onChange={(e) => setNewTaskColumnId(e.target.value)}
          style={{
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #c5c0b1',
            background: '#fffefb',
            color: '#201515',
            fontSize: '0.9em'
          }}
        >
          {columns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.wip_limit ? `(Max: ${c.wip_limit})` : ''}
            </option>
          ))}
        </select>
        <label style={{ fontSize: '0.85em', color: '#201515', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <input type="checkbox" checked={isUrgent === 1} onChange={(e) => setIsUrgent(e.target.checked ? 1 : 0)} />
          Urgent
        </label>
        <label style={{ fontSize: '0.85em', color: '#201515', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <input type="checkbox" checked={isImportant === 1} onChange={(e) => setIsImportant(e.target.checked ? 1 : 0)} />
          Important
        </label>
        <button
          type="submit"
          style={{
            background: '#ff4f00',
            color: '#fffefb',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '0.9em',
            boxShadow: '0 2px 4px rgba(255, 79, 0, 0.2)'
          }}
        >
          + Add Task
        </button>
      </form>

      {/* Drag & Drop Board */}
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
                      background: snapshot.isDraggingOver ? '#f3ede6' : '#f8f4f0',
                      borderRadius: '12px',
                      padding: '16px',
                      minWidth: '260px',
                      width: '260px',
                      border: isFull ? '2px solid #ff4f00' : '1px solid #c5c0b1',
                      transition: 'background 0.2s, border 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ margin: 0, fontSize: '1em', color: '#201515', fontWeight: '700' }}>
                        {col.name}{' '}
                        <span style={{ fontSize: '0.85em', fontWeight: '600', color: isFull ? '#ff4f00' : '#605d52' }}>
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
                            style={{ width: '50px', padding: '2px 4px', fontSize: '0.8em', borderRadius: '4px', border: '1px solid #c5c0b1' }}
                          />
                          <button onClick={() => handleSaveWipLimit(col.id)} style={{ fontSize: '0.75em', padding: '2px 6px' }}>Save</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingColId(col.id);
                            setEditWipLimit(col.wip_limit ?? '');
                          }}
                          style={{ background: 'none', border: 'none', color: '#939084', fontSize: '0.8em', cursor: 'pointer' }}
                          title="Edit WIP limit"
                        >
                          ⚙️
                        </button>
                      )}
                    </div>

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
