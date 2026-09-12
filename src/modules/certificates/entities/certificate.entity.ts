// certificates/entities/certificate.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  issuer!: string;

  @Column({ type: 'date' })
  issueDate!: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  // @ManyToOne(() => Barber, (barber) => barber.certificates, {
  //   onDelete: 'CASCADE',
  // })
  // @JoinColumn({ name: 'barberId' })
  // barber!: Barber;

  @Column({ name: 'barberId' })
  barberId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
