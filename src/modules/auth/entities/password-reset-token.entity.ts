import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() @Index() userId!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
  @Column({ unique: true }) tokenHash!: string;
  @Column() expiresAt!: Date;
  @Column({ type: 'datetime', nullable: true }) usedAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
}
