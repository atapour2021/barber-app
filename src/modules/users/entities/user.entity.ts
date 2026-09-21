import { Appointment } from 'src/modules/appointments/entities/appointment.entity';
import { Barber } from 'src/modules/barbers/entities/barber.entity';
import { Barbershop } from 'src/modules/barbershops/entities/barbershop.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) nationalCode!: string;
  @Column() name!: string;
  @Column() family!: string;
  @Column({ unique: true }) username!: string;
  @Column({ select: false }) password!: string;
  @Column() phoneNumber!: string;
  @Column({ unique: true, nullable: true }) email?: string;
  @Column({ nullable: true }) profileImage?: string;
  @Column({ type: 'text', default: 'USER' }) role!: string;
  @Column({ default: true }) isActive!: boolean;
  @CreateDateColumn({ name: 'createdAt' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updatedAt' }) updatedAt!: Date;
  @OneToMany(() => Barbershop, (shop) => shop.owner, { cascade: true })
  barbershops!: Barbershop[];
  @OneToMany(() => Barber, (barber) => barber.user, { cascade: true })
  barbers!: Barber[];
  @OneToMany(() => Appointment, (appointment) => appointment.user, {
    cascade: true,
  })
  appointments!: Appointment[];
}
