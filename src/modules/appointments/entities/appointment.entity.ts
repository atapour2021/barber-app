import { AppointmentStatus } from 'src/enums/appointment-status';
import { Barber } from 'src/modules/barbers/entities/barber.entity';
import { Service } from 'src/modules/services/entities/service.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Column({ nullable: true, type: 'text' })
  notes?: string;

  @ManyToOne(() => User, (user) => user.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'userId' })
  userId: string;

  @ManyToOne(() => Barber, (barber) => barber.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'barberId' })
  barber: Barber;

  @Column({ name: 'barberId' })
  barberId: string;

  @ManyToOne(() => Service, (service) => service.appointments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'serviceId' })
  service: Service;

  @Column({ name: 'serviceId' })
  serviceId: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  constructor() {
    this.id = '';
    this.date = new Date();
    this.startTime = new Date();
    this.endTime = new Date();
    this.status = AppointmentStatus.PENDING;
    this.userId = '';
    this.barberId = '';
    this.serviceId = '';
    this.user = new User();
    this.barber = new Barber();
    this.service = new Service();
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.notes = undefined;
  }
}
