import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) key!: string;
  @Column({ type: 'text', nullable: true }) value?: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @CreateDateColumn({ name: 'createdAt' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updatedAt' }) updatedAt!: Date;
}
