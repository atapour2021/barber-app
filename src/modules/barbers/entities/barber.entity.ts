import type { WorkingHours } from 'src/enums/working-hours';
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

@Entity('barbers')
export class Barber {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fullName!: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  profileImage?: string;

  @Column({ type: 'jsonb', nullable: true })
  specialties?: string[];

  @Column({ default: true })
  isAvailable!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  workingHours?: WorkingHours;

  @ManyToOne(() => Barbershop, (shop) => shop.barbers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'barbershopId' })
  barbershop!: Barbershop;

  @Column({ name: 'barbershopId' })
  barbershopId!: string;

  @ManyToOne(() => User, (user) => user.barbers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ name: 'userId' })
  userId!: string;

  @OneToMany(() => Appointment, (appointment) => appointment.barber, {
    cascade: true,
  })
  appointments!: Appointment[];

  // If you want to keep certificates, you need to create a Certificate entity
  // For now, comment it out or remove it
  // @OneToMany(() => Certificate, (certificate) => certificate.barber, {
  //   cascade: true,
  // })
  // certificates!: Certificate[];

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
