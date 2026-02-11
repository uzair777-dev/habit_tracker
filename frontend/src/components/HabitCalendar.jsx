import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HabitCalendar({ user, habits }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [completions, setCompletions] = useState([]);

    useEffect(() => {
        if (user) {
            fetchCompletions();
        }
    }, [user, currentDate]);

    const fetchCompletions = async () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const startDate = new Date(year, month, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

        try {
            const response = await fetch(
                `/api/habits/completions?userId=${user.id}&startDate=${startDate}&endDate=${endDate}`
            );
            const data = await response.json();
            setCompletions(data.completions || []);
        } catch (error) {
            console.error('Failed to fetch completions:', error);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek };
    };

    const getCompletionsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return completions.filter(c => {
            const completionDate = new Date(c.completion_date);
            return completionDate.toISOString().split('T')[0] === dateStr;
        });
    };

    const isHabitScheduledForDate = (habit, date) => {
        // Date range check
        const dateStr = date.toISOString().split('T')[0];
        const startDateStr = new Date(habit.startDate).toISOString().split('T')[0];
        
        if (dateStr < startDateStr) return false;
        if (habit.endDate) {
            const endDateStr = new Date(habit.endDate).toISOString().split('T')[0];
            if (dateStr > endDateStr) return false;
        }

        // Schedule type check
        const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        
        switch(habit.scheduleType) {
            case 'daily':
                return true;
            case 'weekdays':
                return dayOfWeek >= 1 && dayOfWeek <= 5;
            case 'weekends':
                return dayOfWeek === 0 || dayOfWeek === 6;
            case 'custom':
                if (!habit.scheduleDays) return false;
                const days = habit.scheduleDays.split(',').map(d => parseInt(d)); // fixed: split logic same as backend
                return days.includes(dayOfWeek);
            default:
                return true;
        }
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Create calendar grid
    const calendarDays = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayCompletions = getCompletionsForDate(date);
        const completionCount = dayCompletions.length;
        const todayClass = isToday(date) ? 'today' : '';
        
        // Find all habits scheduled for this day
        const scheduledHabits = habits ? habits.filter(habit => isHabitScheduledForDate(habit, date)) : [];

        calendarDays.push(
            <div 
                key={day} 
                className={`calendar-day ${todayClass}`}
                style={{ height: '100px', overflowY: 'auto' }} // Increased height for labels
            >
                <div className="day-number" style={{ marginBottom: '4px' }}>{day}</div>
                
                <div className="day-habits" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {scheduledHabits.map(habit => {
                        const isCompleted = dayCompletions.some(c => c.habit_id === habit.id);
                        return (
                            <div 
                                key={habit.id} 
                                className="habit-label"
                                title={habit.description || habit.name}
                                style={{ 
                                    fontSize: '0.7rem', 
                                    padding: '2px 4px', 
                                    borderRadius: '4px',
                                    backgroundColor: isCompleted ? 'var(--success)' : 'rgba(255, 255, 255, 0.1)',
                                    color: isCompleted ? 'var(--background)' : 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    cursor: 'help'
                                }}
                            >
                                {habit.name}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="habit-calendar">
            <div className="calendar-header">
                <button onClick={previousMonth} className="btn-icon" aria-label="Previous month">
                    <ChevronLeft size={20} />
                </button>
                <h3>{monthName}</h3>
                <button onClick={nextMonth} className="btn-icon" aria-label="Next month">
                    <ChevronRight size={20} />
                </button>
            </div>

            <div className="calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="weekday">{day}</div>
                ))}
            </div>

            <div className="calendar-grid">
                {calendarDays}
            </div>
            
            <div className="calendar-legend" style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <p>Habits are displayed on their scheduled dates. Green indicates completion.</p>
            </div>
        </div>
    );
}
