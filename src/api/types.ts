import type { components } from './schema';

export type Schemas = components['schemas'];

export type SessionView = Schemas['SessionViewResponse'];
export type SessionStatus = NonNullable<
  Schemas['SessionStatusResponse']['session']
>;
export type ChildPhase = NonNullable<Schemas['SessionChildResponse']['phase']>;
export type MemberRole = NonNullable<Schemas['MemberResponse']['role']>;
export type ConsentType = NonNullable<Schemas['ConsentRequest']['type']>;
export type SessionEvent = Schemas['SessionEventResponse'];
