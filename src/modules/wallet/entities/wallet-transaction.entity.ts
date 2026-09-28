import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Wallet } from './wallet.entity';

export enum WalletTxType {
  TOPUP = 'topup',
  PAYMENT = 'payment',
  REFUND = 'refund',
  PAYOUT = 'payout',
  ADJUSTMENT = 'adjustment',
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum WalletTxStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  FAILED = 'failed',
}

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() walletId!: string;
  @ManyToOne(() => Wallet, (w) => w.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletId' })
  wallet!: Wallet;
  @Column() userId!: string;
  @Column({ type: 'text' }) type!: string;
  @Column({ type: 'text', default: WalletTxStatus.COMPLETED }) status!: string;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) amount!: number;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) balanceAfter!: number;
  @Column({ nullable: true }) description?: string;
  @Column({ nullable: true }) referenceId?: string;
  @Column({ type: 'simple-json', nullable: true }) metadata?: Record<
    string,
    unknown
  > | null;
  @Column({ nullable: true }) createdById?: string;
  @CreateDateColumn({ name: 'createdAt' }) createdAt!: Date;
}
