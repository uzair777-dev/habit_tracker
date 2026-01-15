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

        calendarDays.push(
            <div 
                key={day} 
                className={`calendar-day ${todayClass}`}
                title={dayCompletions.map(c => c.habit_name).join(', ')}
            >
                <div className="day-number">{day}</div>
                {completionCount > 0 && (
                    <div className="completion-indicator" data-count={Math.min(completionCount, 5)}>
                        <div className="completion-dots">
                            {dayCompletions.slice(0, 3).map((completion, idx) => (
                                <div key={idx} className="completion-dot" title={completion.habit_name}></div>
                            ))}
                            {completionCount > 3 && <span className="more-indicator">+{completionCount - 3}</span>}
                        </div>
                    </div>
                )}
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

            {habits && habits.length > 0 && (
                <div className="calendar-legend">
                    <h4>Active Habits</h4>
                    <div className="legend-items">
                        {habits.map(habit => (
                            <div key={habit.id} className="legend-item">
                                <div className="legend-dot"></div>
                                <span>{habit.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
