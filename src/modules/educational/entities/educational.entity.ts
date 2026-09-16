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

@Entity('educationals')
export class Educational {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() title!: string;
  @Column({ nullable: true, type: 'text' }) description?: string;
  @Column({ nullable: true }) videoUrl?: string;
  @Column({ nullable: true }) videoFilename?: string;
  @Column({ nullable: true }) originalFilename?: string;
  @Column({ nullable: true }) mimeType?: string;
  @Column({ nullable: true, type: 'int' }) fileSize?: number;
  @Column({ nullable: true, type: 'text' }) startDate?: string;
  @ManyToOne(() => Barber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'barberId' })
  barber!: Barber;
  @Column({ name: 'barberId' }) barberId!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
