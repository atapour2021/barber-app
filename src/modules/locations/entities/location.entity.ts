import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Barber } from '../../barbers/entities/barber.entity';
import { User } from '../../users/entities/user.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() address!: string;
  @Column({ nullable: true }) label?: string;
  @Column({ type: 'decimal', precision: 10, scale: 8 }) latitude!: number;
  @Column({ type: 'decimal', precision: 11, scale: 8 }) longitude!: number;
  @Column({ type: 'simple-json', nullable: true }) mapMetadata?: Record<
    string,
    any
  >;
  @ManyToOne(() => Barber, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'barberId' })
  barber?: Barber | null;
  @Column({ name: 'barberId', unique: true, nullable: true })
  barberId?: string | null;
  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User | null;
  @Column({ name: 'userId', nullable: true })
  userId?: string | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
