import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('educationals')
export class Educational {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() title!: string;
  @Column({ nullable: true, type: 'text' }) description?: string;
  @Column({ nullable: true, type: 'text' }) startDate?: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
