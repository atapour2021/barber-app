import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Barber } from './barber.entity';
import { Service } from '../../services/entities/service.entity';

@Entity('barber_services')
export class BarberService {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'barberId' }) barberId!: string;
  @Column({ name: 'serviceId' }) serviceId!: string;
  @Column({ type: 'decimal', precision: 10, scale: 2 }) price!: number;
  @Column({ type: 'int' }) duration!: number;
  @ManyToOne(() => Barber, (b) => b.barberServices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'barberId' })
  barber!: Barber;
  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'serviceId' })
  service!: Service;
}
