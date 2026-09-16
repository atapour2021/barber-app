import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Barbershop } from 'src/modules/barbershops/entities/barbershop.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BarberService } from './barber-service.entity';

export enum BarberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('barbers')
export class Barber {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() fullName!: string;
  @Column({ nullable: true }) bio?: string;
  @Column({ nullable: true }) profileImage?: string;
  @Column({ type: 'simple-json', nullable: true }) specialties?: string[];
  @Column({ type: 'simple-json', nullable: true }) workingDays?: string[];
  @Column({ type: 'simple-json', nullable: true }) workingHours?: Record<
    string,
    { start: string; end: string }
  >;
  @Column({ type: 'simple-json', nullable: true }) breakTime?:
    | Record<string, { start: string; end: string }>
    | { start: string; end: string };
  @Column({ type: 'simple-json', nullable: true }) holidays?: string[];
  @Column({ type: 'text', default: BarberStatus.ACTIVE }) status!: string;
  @Column({ default: true }) isAvailable!: boolean;
  @Column({ default: true }) isActive!: boolean;
  @ManyToOne(() => Barbershop, (shop) => shop.barbers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'barbershopId' })
  barbershop!: Barbershop;
  @Column({ name: 'barbershopId' }) barbershopId!: string;
  @ManyToOne(() => User, (user) => user.barbers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
  @Column({ name: 'userId' }) userId!: string;
  @OneToMany(() => BarberService, (bs) => bs.barber, { cascade: true })
  barberServices!: BarberService[];
  @OneToMany(() => Appointment, (a) => a.barber, { cascade: true })
  appointments!: Appointment[];
  @CreateDateColumn({ name: 'createdAt' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updatedAt' }) updatedAt!: Date;
}
