import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Barbershop } from 'src/modules/barbershops/entities/barbershop.entity';
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
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  duration: number;

  @Column({ nullable: true })
  icon: string;

  @ManyToOne(() => Barbershop, (shop) => shop.services)
  @JoinColumn({ name: 'barbershopId' })
  barbershop: Barbershop;

  @OneToMany(() => Appointment, (appointment) => appointment.service)
  appointments: Appointment[];

  @Column()
  barbershopId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
