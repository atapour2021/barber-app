import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'int' })
  duration!: number;

  @Column({ nullable: true })
  icon?: string;

  @ManyToOne('Barber', { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'barberId' })
  barber?: any;

  @Column({ name: 'barberId' })
  barberId!: string;

  @ManyToOne('Barbershop', { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'barbershopId' })
  barbershop?: any;

  @Column({ name: 'barbershopId', nullable: true })
  barbershopId?: string;

  @OneToMany(() => Appointment, (appointment) => appointment.service)
  appointments!: Appointment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
