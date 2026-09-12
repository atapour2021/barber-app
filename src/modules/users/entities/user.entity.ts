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
  @PrimaryGeneratedColumn('uuid')
  id!: string; // Added !

  @Column({ unique: true })
  email!: string; // Added !

  @Column()
  password!: string; // Added !

  @Column()
  fullName!: string; // Added !

  @Column({ nullable: true })
  phoneNumber?: string; // Changed to optional

  @Column({ nullable: true })
  profileImage?: string; // Changed to optional

  @Column({ type: 'text', default: 'USER' })
  role!: string; // Added !

  @Column({ default: true })
  isActive!: boolean; // Added !

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date; // Added !

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date; // Added !

  // Relationship with Barbershops (as owner)
  @OneToMany(() => Barbershop, (shop) => shop.owner, {
    cascade: true,
  })
  barbershops!: Barbershop[]; // Added !

  // Relationship with Barbers (as user)
  @OneToMany(() => Barber, (barber) => barber.user, {
    cascade: true,
  })
  barbers!: Barber[]; // Added !

  // Relationship with Appointments
  @OneToMany(() => Appointment, (appointment) => appointment.user, {
    cascade: true,
  })
  appointments!: Appointment[]; // Added !
}
