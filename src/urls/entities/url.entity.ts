import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ClickEvent } from '../../analytics/entities/click-event.entity';

@Entity('urls')
export class Url {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true, length: 10 })
  shortCode: string;

  @Column({ type: 'text' })
  originalUrl: string;

  @Column({ nullable: true, type: 'varchar' })
  userId: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.urls, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => ClickEvent, (event) => event.url)
  clickEvents: ClickEvent[];
}
