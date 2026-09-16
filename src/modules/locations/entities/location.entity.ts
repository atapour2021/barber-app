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

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() address!: string;
  @Column({ type: 'decimal', precision: 10, scale: 8 }) latitude!: number;
  @Column({ type: 'decimal', precision: 11, scale: 8 }) longitude!: number;
  @Column({ type: 'simple-json', nullable: true }) mapMetadata?: Record<string, any>;
  @ManyToOne(() => Barber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'barberId' })
  barber!: Barber;
  @Column({ name: 'barberId', unique: true }) barberId!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
