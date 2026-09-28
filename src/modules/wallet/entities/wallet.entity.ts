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
import { WalletTransaction } from './wallet-transaction.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) userId!: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance!: number;
  @Column({ default: 'IRR' }) currency!: string;
  @Column({ default: true }) isActive!: boolean;
  @OneToMany(() => WalletTransaction, (t) => t.wallet, { cascade: true })
  transactions!: WalletTransaction[];
  @CreateDateColumn({ name: 'createdAt' }) createdAt!: Date;
  @UpdateDateColumn({ name: 'updatedAt' }) updatedAt!: Date;
}
