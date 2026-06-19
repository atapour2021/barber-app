import { Certificate } from 'crypto';
import { WorkingHours } from 'src/enums/working-hours';
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
  id!: string; // Added ! for definite assignment

  @Column()
  fullName!: string; // Added !

  @Column({ nullable: true })
  bio?: string; // Changed to optional

  @Column({ nullable: true })
  profileImage?: string; // Changed to optional

  @Column({ type: 'jsonb', nullable: true })
  specialties?: string[]; // Changed to optional and fixed type

  @Column({ default: true })
  isAvailable!: boolean; // Added !

  @Column({ type: 'jsonb', nullable: true })
  workingHours?: WorkingHours; // Changed to optional and fixed type

  @ManyToOne(() => Barbershop, (shop) => shop.barbers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'barbershopId' })
  barbershop!: Barbershop; // Added !

  @Column({ name: 'barbershopId' })
  barbershopId!: string; // Added !

  @ManyToOne(() => User, (user) => user.barbers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User; // Added !

  @Column({ name: 'userId' })
  userId!: string; // Added !

  @OneToMany(() => Appointment, (appointment) => appointment.barber, {
    cascade: true,
  })
  appointments!: Appointment[]; // Added !

  @OneToMany(() => Certificate, (certificate) => certificate.barber, {
    cascade: true,
  })
  certificates!: Certificate[]; // Added !

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date; // Added !

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date; // Added !
}
