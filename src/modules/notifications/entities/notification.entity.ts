import { NotificationType } from 'src/enums/notification-type';
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

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'userId' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  type: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'simple-json', nullable: true })
  data?: Record<string, any> | null;

  @Column({ name: 'appointmentId', nullable: true, type: 'text' })
  appointmentId?: string | null;

  @Column({ default: false })
  isRead: boolean;

  @Column({ name: 'readAt', type: 'text', nullable: true })
  readAt?: Date | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  constructor() {
    this.type = NotificationType.BOOKING_CREATED;
    this.title = '';
    this.body = '';
    this.data = null;
    this.appointmentId = null;
    this.isRead = false;
    this.readAt = null;
  }
}
