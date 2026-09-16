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

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() name!: string;
  @Column() issuer!: string;
  @Column({ type: 'date' }) issueDate!: Date;
  @Column({ type: 'date', nullable: true }) expiryDate?: Date;
  @ManyToOne(() => Barber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'barberId' })
  barber!: Barber;
  @Column({ name: 'barberId' }) barberId!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
