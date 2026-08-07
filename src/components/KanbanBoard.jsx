// src/components/KanbanBoard.jsx
import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Draggable as FcDraggable } from '@fullcalendar/interaction';
import TaskCard from './TaskCard.jsx';
import Toast from './Toast.jsx';
import AddTaskModal from './AddTaskModal.jsx';
import ScheduleModal from './ScheduleModal.jsx';

export default function KanbanBoard({ tasks, setTasks, columns: propColumns, setColumns: propSetColumns }) {
  const [localColumns, setLocalColumns] = useState([
    { id: 1, name: 'Backlog', wip_limit: null },
    { id: 2, name: 'Ready to Start', wip_limit: 3 },
    { id: 3, name: 'In Progress', wip_limit: 2 },
    { id: 4, name: 'Done', wip_limit: null }
  ]);

  const columns = propColumns || localColumns;
  const setColumns = propSetColumns || setLocalColumns;

  const [alert, setAlert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [schedulingTask, setSchedulingTask] = useState(null);
  const [editingColId, setEditingColId] = useState(null);
  const [editWipLimit, setEditWipLimit] = useState('');

  // Ref for FullCalendar external Draggable registration
  const boardRef = useRef(null);

  useEffect(() => {
    if (!boardRef.current) return;

    const draggable = new FcDraggable(boardRef.current, {
      itemSelector: '.fc-drag-handle',
      eventData: (el) => {
        try {
          return JSON.parse(el.getAttribute('data-event'));
        } catch {
          return { title: 'Task', duration: '01:00' };
        }
      }
    });

    return () => draggable.destroy();
  }, []);

  const showAlert = (msg) => {
    setAlert(msg);
    setTimeout(() => setAlert(null), 4000);
  };

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceColId = Number(source.droppableId);
    const destColId = Number(destination.droppableId);
    if (sourceColId === destColId && source.index === destination.index) return;

    const destCol = columns.find((c) => c.id === destColId);
    const currentDestTasks = tasks.filter((t) => Number(t.column_id) === destColId);

    if (sourceColId !== destColId && destCol && destCol.wip_limit !== null) {
      if (currentDestTasks.length >= destCol.wip_limit) {
        showAlert(`⚠️ WIP Limit Reached! Cannot move task into "${destCol.name}" (Max: ${destCol.wip_limit}).`);
        return;
      }
    }

    const draggedTask = tasks.find((t) => Number(t.id) === Number(draggableId));

    // Intercept move to Ready to Start (Column 2) if not yet scheduled
    if (destColId === 2 && draggedTask && !draggedTask.schedule_start) {
      setSchedulingTask({ ...draggedTask, targetPosition: destination.index });
      return;
    }

    // Direct move for other columns or already scheduled tasks
    const updatedTasks = tasks.map((t) => (Number(t.id) === Number(draggableId) ? { ...t, column_id: destColId } : t));
    setTasks(updatedTasks);

    try {
      await fetch(`/api/tasks/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_id: destColId, position: destination.index })
      });
    } catch (err) {
      console.log('Failed to persist task move to server');
    }
  };

  const handleConfirmSchedule = async (taskToSchedule, startIso, endIso) => {
    const updatedTasks = tasks.map((t) =>
      Number(t.id) === Number(taskToSchedule.id)
        ? { ...t, column_id: 2, schedule_start: startIso, schedule_end: endIso }
        : t
    );
    setTasks(updatedTasks);
    setSchedulingTask(null);

    try {
      await fetch(`/api/tasks/${taskToSchedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          column_id: 2,
          schedule_start: startIso,
          schedule_end: endIso,
          position: taskToSchedule.targetPosition || 0
        })
      });
    } catch (err) {
      console.log('Failed to persist schedule to server');
    }

    showAlert(`✅ Task "${taskToSchedule.title}" scheduled & moved to Ready to Start!`);
  };

  const handleAddTaskData = async (taskData) => {
    if (!taskData.title || !taskData.title.trim()) {
      showAlert('⚠️ Please enter a task title!');
      return;
    }

    const targetColId = Number(taskData.column_id);
    const targetCol = columns.find((c) => c.id === targetColId);
    const currentTasks = tasks.filter((t) => Number(t.column_id) === targetColId);

    if (targetCol && targetCol.wip_limit !== null && currentTasks.length >= targetCol.wip_limit) {
      showAlert(`⚠️ Cannot add task to "${targetCol.name}". WIP limit of ${targetCol.wip_limit} reached!`);
      return;
    }

    const newTaskPayload = {
      column_id: targetColId,
      title: taskData.title.trim(),
      description: taskData.description || '',
      is_urgent: taskData.is_urgent,
      is_important: taskData.is_important,
      urgency_level: taskData.urgency_level,
      importance_level: taskData.importance_level
    };

    const tempTask = {
      id: Date.now(),
      ...newTaskPayload
    };

    setTasks((prev) => [...prev, tempTask]);
    setIsModalOpen(false);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTaskPayload)
      });
      if (res.ok) {
        const savedTask = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === tempTask.id ? savedTask : t)));
      }
    } catch (err) {
      console.log('Task saved locally in state');
    }

    showAlert(`✅ Task "${newTaskPayload.title}" added to ${targetCol?.name ?? 'Backlog'}!`);
  };

  const handleSaveWipLimit = (colId) => {
    const limit = editWipLimit === '' ? null : Number(editWipLimit);
    setColumns(columns.map((c) => (c.id === colId ? { ...c, wip_limit: limit } : c)));
    setEditingColId(null);
  };

  return (
    <div ref={boardRef} style={{ padding: '0px' }}>
      {/* Floating Toast Notification */}
      <Toast message={alert} />

      {/* Add Task Pop-up Modal */}
      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddTaskData}
        columns={columns}
      />

      {/* Schedule Time Block Modal */}
      <ScheduleModal
        isOpen={Boolean(schedulingTask)}
        onClose={() => setSchedulingTask(null)}
        onConfirm={handleConfirmSchedule}
        task={schedulingTask}
      />

      {/* Primary + Add Task Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          width: '100%',
          padding: '12px',
          marginBottom: '16px',
          background: '#ff4f00',
          color: '#fffefb',
          border: 'none',
          borderRadius: '12px',
          fontWeight: '700',
          cursor: 'pointer',
          fontSize: '0.95em',
          boxShadow: '0 2px 4px rgba(255, 79, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          gap: '8px'
        }}
      >
        <span>➕ Add Task</span>
      </button>

      {/* Drag & Drop Board (Vertical Stack) */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => Number(t.column_id) === Number(col.id));
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
                      width: '100%',
                      boxSizing: 'border-box',
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

                    <div style={{ minHeight: '60px' }}>
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
