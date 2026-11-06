package com.healthcare.medicalplatform.model.entity;

import jakarta.persistence.*;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "working_hours",
        uniqueConstraints = @UniqueConstraint(columnNames = {"practitioner_id", "day_of_week"}))
public class WorkingHours {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "practitioner_id")
    private Practitioner practitioner;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 16)
    private DayOfWeek dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "break_start")
    private LocalTime breakStart;

    @Column(name = "break_end")
    private LocalTime breakEnd;

    @Column(name = "slot_minutes", nullable = false)
    private int slotMinutes;

    protected WorkingHours() {
    }

    public WorkingHours(Practitioner practitioner, DayOfWeek dayOfWeek) {
        this.practitioner = practitioner;
        this.dayOfWeek = dayOfWeek;
    }

    public void set(LocalTime start, LocalTime end, LocalTime breakStart, LocalTime breakEnd, int slotMinutes) {
        this.startTime = start;
        this.endTime = end;
        this.breakStart = breakStart;
        this.breakEnd = breakEnd;
        this.slotMinutes = slotMinutes;
    }

    public UUID getId() { return id; }
    public Practitioner getPractitioner() { return practitioner; }
    public DayOfWeek getDayOfWeek() { return dayOfWeek; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }
    public LocalTime getBreakStart() { return breakStart; }
    public LocalTime getBreakEnd() { return breakEnd; }
    public int getSlotMinutes() { return slotMinutes; }
}
