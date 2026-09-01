import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const EventContext = createContext(null);

export function EventProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.get('/events');
      if (res.success && Array.isArray(res.data)) {
        setEvents(res.data);

        // Determine active event
        if (user?.role === 'ADMIN' && user?.eventId) {
          const userEvent = res.data.find(e => e.id === user.eventId);
          setSelectedEvent(userEvent || { id: user.eventId, event_name: user.eventName || 'Assigned Event' });
        } else {
          // SuperAdmin
          const savedEventId = localStorage.getItem('eventgen_selected_event_id');
          if (savedEventId) {
            const matched = res.data.find(e => String(e.id) === String(savedEventId));
            if (matched) {
              setSelectedEvent(matched);
            } else if (res.data.length > 0) {
              setSelectedEvent(res.data[0]);
              localStorage.setItem('eventgen_selected_event_id', res.data[0].id);
            }
          } else if (res.data.length > 0) {
            setSelectedEvent(res.data[0]);
            localStorage.setItem('eventgen_selected_event_id', res.data[0].id);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load events:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [isAuthenticated, user?.eventId]);

  const selectEvent = (event) => {
    if (user?.role === 'ADMIN') return; // Admins locked to their event
    setSelectedEvent(event);
    if (event && event.id) {
      localStorage.setItem('eventgen_selected_event_id', event.id);
    } else {
      localStorage.removeItem('eventgen_selected_event_id');
    }
  };

  return (
    <EventContext.Provider value={{
      events,
      selectedEvent,
      selectEvent,
      refreshEvents: fetchEvents,
      loading
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
}
