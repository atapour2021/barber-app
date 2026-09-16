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

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() @Index() userId!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
  @Column({ unique: true }) tokenHash!: string;
  @Column() expiresAt!: Date;
  @Column({ type: 'datetime', nullable: true }) revokedAt!: Date | null;
  @Column({ type: 'uuid', nullable: true }) replacedById!: string | null;
  @CreateDateColumn() createdAt!: Date;
}
