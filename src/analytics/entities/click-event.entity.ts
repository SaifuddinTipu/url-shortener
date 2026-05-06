import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Url } from '../../urls/entities/url.entity';

@Entity('click_events')
export class ClickEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  urlId: string;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true, length: 500 })
  userAgent: string;

  @Column({ nullable: true })
  country: string;

  @CreateDateColumn()
  clickedAt: Date;

  @ManyToOne(() => Url, (url) => url.clickEvents)
  @JoinColumn({ name: 'urlId' })
  url: Url;
}
