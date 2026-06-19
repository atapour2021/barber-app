import { Barber } from 'src/modules/barbers/entities/barber.entity';
import { Service } from 'src/modules/services/entities/service.entity';
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

@Entity('barbershops')
export class Barbershop {
  @PrimaryGeneratedColumn('uuid')
  id!: string; // Added !

  @Column()
  name!: string; // Added !

  @Column({ type: 'text' }) // Fixed: added type explicitly
  description!: string; // Added !

  @Column()
  address!: string; // Added !

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude!: number; // Added !

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  longitude!: number; // Added !

  @Column({ nullable: true })
  phoneNumber?: string; // Changed to optional

  @Column({ nullable: true })
  logo?: string; // Changed to optional

  @Column({ default: true })
  isActive!: boolean; // Added !

  @ManyToOne(() => User, (user) => user.barbershops, {
    onDelete: 'CASCADE', // Added cascade
  })
  @JoinColumn({ name: 'ownerId' })
  owner!: User; // Added !

  @Column({ name: 'ownerId' }) // Added explicit name
  ownerId!: string; // Added !

  @OneToMany(() => Barber, (barber) => barber.barbershop, {
    cascade: true, // Added cascade
  })
  barbers!: Barber[]; // Added !

  @OneToMany(() => Service, (service) => service.barbershop, {
    cascade: true, // Added cascade
  })
  services!: Service[]; // Added !

  @CreateDateColumn({ name: 'createdAt' }) // Added name
  createdAt!: Date; // Added !

  @UpdateDateColumn({ name: 'updatedAt' }) // Added name
  updatedAt!: Date; // Added !
}
