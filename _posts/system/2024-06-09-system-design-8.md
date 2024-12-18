---
title: "분산 이메일 서비스"
date: '2024-06-09'
categories: [ 설계, 가상면접 사례로 배우는 대규모 시스템 설계기초 ]
tags: [ 면접 ]
---

# 분산 이메일 서비스

# 1. 문제 이해 및 설계 범위 확정

## 기능 요구사항

- 대상 : 10억 명
- 기능 : ~~인증~~, 이메일 발/수신, 가져오기, 필터링, 검색, 스팸 방지, 첨부파일
- 통신 : HTTP

## 비기능 요구사항

- **안정성** : 데이터가 소실되어서는 안됨
- **가용성** : 장애가 있어도 시스템 동작(복제)
- **확장성** : 사용자가 늘어도 영향 X
- **유연성** : 기능 추가가 쉬워야 함

## 개략적인 규모 추정

- 발송 QPS = 10억명 x 인당 하루 평균 이메일 전송 10건 = 100,000
- 수신 메타데이터 양 = 인당 하루 평균 이메일 수신 40건 x 메타데이터 50KB
- 첨부파일은 전체메일의 20%, 평균크기 500KB

메타데이터는 DB에 저장 → 1년 **730PB**

첨부파일 저장 → 1년 **1460PB**

---

# 2. 개략적 설계안 제시 및 동의 구하기

## 전통적 메일 서버

### 이메일 프로토콜

**발송**

- [**SMTP](https://aws.amazon.com/ko/what-is/smtp/)** : Simple Mail Transfer Protocol

**수신**

- **POP** : 한대 단말에서만 읽을 수 있음, 이메일을 일부만 읽을 수 없고 전부 다운로드 해야 함
- **IMAP** :  여러 단말에서 + 일부만 읽을 수 있음, 인터넷이 느린 환경에서도 동작(메일을 읽기 전에는 헤더만 다운로드 하기 때문), 보편적으로 사용

### DNS

- 수신자 도메인의 메일 교환기 레코드(MX) 검색에 이용됨

### 첨부파일

- 메시지와 함께 전달
- 일반적으로 Base64 인코딩
- 보통 크기 제한 있음
- [MIME](https://www.ibm.com/docs/ko/sc-and-ds/8.5.0?topic=guide-mime-types) 프로토콜

### **아키텍처**



1. 메일을 보낼 시 아웃룩 메일 서버로 전송됨
2. 아웃룩 메일 서버는 수신자의 DNS 질의를 통해 수신자의 SMTP 서버 주소를 찾고 메일을 보냄
3. 지메일 서버는 메일을 저장
4. 수신자가 로그인 할 때 지메일 클라이언트는 IMAP/POP 서버를 통해 메일을 읽을 수 있도록 함

### **저장소**

- 전통적으로 디렉터리 구조에 저장
- 규모가 커지면 디스크 I/O가 병목이 됨
- 하나의 서버에 저장하므로 가용서, 확장성, 안정성에 문제

→ 분산데이터 저장소 계층이 필요해짐

## 분산 메일 서버

### **이메일 API**

- 모바일 단말 클라이언트를 위한 SMTP/POP/IMAP API
- 송신 + 수신 메일 서버간 SMTP
- 대화형 웹 기반 애플리케이션을 위한 HTTP RESTful API

→ 웹메일 통신에는 일반적으로 HTTP가 쓰임

### **엔드 포인트**

1. 메시지 전송
2. 폴더 조회
3. 폴더의 메시지 조회 : 페이징
4. 메시지 조회 : 발신자, 수신자, 제목, 본문, 첨부파일

### **아키텍처**



- **웹 메일** : 브라우저를 통해 메일 송수신
- **웹 서버** : 사용자가 이용하는 요청/응답 서비스, 로그인, 프로필 관리 등
- **실시간 서버**
  - 메일 내역을 실시간으로 클라이언트에게 전달하는 역할
  - stateful 서버임
  - 롱폴링 || 웹소켓 사용 : 우아한 것은 웹소켓, But 브라우저 호환성 이슈 있을 수 있음

    → 웹소켓 사용 + 롱폴링 백업

- **메타데이터 DB**
- **첨부파일 저장소** : S3 사용
  - 카산드라를 사용해볼까? → 안됨
    - BLOB 자료형을 지원하나 실질적으로 1MB 이상의 파일을 지원하지 못함
    - 첨부파일 때문에 레코드 캐시를 사용하기 힘듬, 메모리 폭발
- **분산 캐시** : 최근 수신 이메일, 레디스 사용
- **검색 저장소** : 분산 문서 저장소, 고속 텍스트 검색을 지원하는 역 인덱스 자료구조 사용

## 이메일 전송 절차



1. **웹 메일** : 메일 작성 후 전송
2. **로드밸런서** : 웹 서버로 전송, Rate limit 적용
3. **웹 서버**
1. 이메일 검증 : 크기 한도 검사
2. 나에게 보냄 : 바이러스 검사 후 저장, 나에게 보내므로 전송할 필요 없음
4. **메시지 큐**
1. 첨부파일이 큰 경우 참조 정보만 저장
2. 기본 검증에 실패한 케이스는 에러 큐에 저장
5. **외부전송 SMTP** : 외부전송 큐의 메시지를 스팸, 바이러스 검사
6. 검증 통과한 메일은 보낸 편지함에 저장
7. **외부전송 SMTP** : 메일 전송

### **웹 서버**와 **외부전송 SMTP 서버**를 분리한 이유

→ 규모의 확장이 가능해짐

### **외부전송 큐**의 모니터링 중요

- 수신자 메일 서버 장애 : 나중에 다시발송, 지수적 백오프가 좋은 전략
- 컨슘 랙 : 컨슈머 추가로 대응

## 이메일 수신 절차



1. **로드밸런서** : 트래픽을 SMTP 서버로 분산 전송
2. **SMTP 서버** : 불필요한 이메일을 필터링
3. 첨부파일이 큰 경우 따로 저장(S3)
4. **수신 이메일 큐** : 규모확장 + 버퍼의 역할
5. 스팸 + 바이러스 필터링
6. 메일을 DB, 캐시, S3에 저장
7. 수신자가 온라인 상태인 경우 실시간 서버로 전송
8. **실시간 서버** : 수신자 클라이언트가 메일을 실시간으로 받을 수 있도록 하는 웹소켓 서버
9. **웹 메일** : 수신자가 오프라인인 경우 RESTful API 를 통해 웹 서버에 다시 연결
10. **웹 서버** : 새로운 메일을 클라이언트에 반환

---

# 3. 상세 설계

규모의 확장에 대해 고민해보기

## 메타데이터 DB

### 특징

- 메일 헤더 : 작고, 빈번함
- 메일 본문 : 사용자는 보통 메일을 한번만 읽음
- 해당 사용자만 읽을 수 있어야 함, 읽음 표시, 검색
- 데이터 신선도가 중요
- 데이터 손실은 용납 X

### 올바른 DB 선정

- **관계형 DB** : 검색에 용이, 데이터 크기가 작을 때 적합 → MySQL이나 PostegreSQL은 부적합
- **분산 객체 저장소(S3)** : 검색, 읽음 표시 할수 없음
- **NoSQL DB** : 구글 빅테이블, 카산드라..?

→ 요구조건에 완벽히 부합하는 DB는 없어보임, NoSQL 정도..?

### 데이터 모델

- userId 기준으로 샤딩 : 여러사용자 볼 수 없음 → 요구사항에 없음으로 괜찮음
- PK 구성 : 파티션 키 + 클러스터 키 조합
  - 파티션 키 : 데이터를 여러 노드에 분산하는 역할, 균등한 키를 고르는 것이 중요
  - 클러스터 키 : 같은 파티션의 데이터를 정렬

- 읽은 & 안읽은 메일 조회 : NoSQL에서는 테이블을 2개로 둠(비정규화)

### 일관성 문제

- 이메일 시스템의 경우 데이터 정확성이 중요하므로 가용성을 희생함

## 이메일 전송 가능성

스팸으로 분류되지 않아야 함

- 전용 IP
- 범주화
- 발신인 평판
- 스팸 차단
- 피드백 처리
- 이메일 인증

## 검색

### 엘라스틱 서치



- 주 이메일 저장소와 엘라스틱과의 동기화가 관건

### DB 검색



- LSM 트리를 사용하여 색인을 구조화하는 것이 바람직함
  - LSM 트리란
    - 카산드라의 핵심 자료구조
    - 데이터 크기가 계층의 임계치를 넘으면 다음 계층으로 병합되는 구조

### 요약



- 소규모의 경우 엘라스틱 서치가 좋은 선택지임
- DB에 내장된 검색 솔루션을 이용하는 것도 좋음

---

# 4. 마무리

더 이야기해보면 좋을 것들

- **결함 내성** : 노드 장애, 네트워크 문제, 이벤트 전달 지연 등의 이슈 대처 방법
- **규정 준수** : 각 국가별 개인정보 보호법
- **보안** : 피싱방지, 안전 브라우징, 첨부파일 사전 경고, 의심스러운 로그인, 송신 기밀 모드, 이메일 암호화 등
- **최적화** : 동일한 첨부파일이 있는지 확인
