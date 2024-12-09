---
title: "카프카 컨슈머"
date: '2023-10-05'
categories: [ Kafka, 카프카 핵심가이드 ]
tags: [ Kafka, Kafka Consumer ]
image:
  path: https://github.com/won0935/won0935.github.io/assets/55419159/ec9c7457-2499-4422-a054-d82e31a25b0e
  alt: 카프카핵심가이드
---

# 4장 카프카 컨슈머: 카프카에서 데이터 읽기

## 시작하기

카프카에서 데이터를 읽는 애플리케이션은 토픽을 구독하고 구독한 토픽들로부터 메시지를 받기 위해 KafkaConsumer 클래스를 사용한다.

- 카프카에서 데이터를 읽는 것은 다른 메시지 전달 시스템과 개념이 조금 다름
  - 이는 카프카 특유의 개념과 발상과 연관

### 4.1 카프카 컨슈머: 개념

카프카의 주 디자인 목표 중 하나는 카프카 토픽에 쓰여진 데이터를 전체 조직 안에서 여러 용도로 사용할 수 있도록 만드는 것이었다.

- 이를 지원하기 위하여 각 컨슈머 애플리케이션이 각자의 컨슈머 그룹을 갖어야 함
- 컨슈머 그룹
  - 각기 다른 여러 컨슈머 애플리케이션이 하나의 토픽을 구독하여 각기 다른 처리를 할 수 있게 함
  - 이런 디자인은 전통적인 메시지 전달 시스템과 달리 성능 저하없이 많은 수의 컨슈머와 컨슈머 그룹으로 확장 가능하게 함
  - 컨슈머는 컨슈머 그룹의 일부로써 동작하며, 동일한 컨슈머 그룹에 속한 여러 개의 컨슈머들이 동일한 토픽을 구독할 경우, 각각의 컨슈머는 해당 토픽에서 서로 다른 파티션의 메시지를 받게 됨

    프로듀서가 컨슈머 애플리케이션이 메시지를 전달 받고 처리하는 속도보다 더 빠른 속도로 토픽에 메시지를 쓴다면 하나의 컨슈머로는 데이터를 모두 처리할 수 없을 것이다.

- 컨슈머가 한개라면 → 추가되는 메시지의 속도를 따라잡을 수 없음 (Lag 발생)
- 따라서 컨슈머 애플리케이션 (개념상 Task라고도 할 수도 있음) 을 확장할 수 있어야 함
- 여러개의 컨슈머가 같은 토픽으로부터 데이터를 분할해서 읽어올 수 있어야 함과 동일한 의미
  - 위 개념을 구현하기 위해 카프카는 컨슈머 그룹에 컨슈머를 추가하는 형태로 확장을 지원
    (p84 ~ 85, 그림 4-1 ~ 4-4)
    - 하나의 컨슈머에 파티션 개수를 적절하게 분배하여 데이터를 읽도록 함
      - 단위 컨슈머가 처리하는 파티션과 메시지 수를 분산하는 것
    - 단, 컨슈머 그룹 내의 컨슈머 수는 파티션 수를 넘을 경우 유휴 컨슈머가 발생함
    - 가장 이상적?
      - 파티션 개수 = (같은 컨슈머 그룹) 컨슈머 개수
      - 토픽을 생성할 때 파티션 수를 크게 잡는게 도움이 될 때도 있음
        - 필요 시 컨슈머를 추가 가능하기 때문에

### 4.2 컨슈머 그룹과 파티션 리밸런스

컨슈머 그룹에 속한 컨슈머들은 자신들이 구독하는 토픽의 파티션들에 대한 소유권을 공유한다.

- 새로운 컨슈머를 컨슈머 그룹에 추가하면 이전에 다른 컨슈머가 읽고 있던 파티션으로부터 메시지를 읽기 시작함
- 컨슈머가 종료되거나 크래시가 났을 경우에도 동일함
  - 컨슈머 하나가 컨슈머 그룹에서 나가면 원래 이 컨슈머가 읽던 파티션들은 그룹에 잔류한 나머지 컨슈머 중 하나가 대신 받아서 읽기 시작

    컨슈머에 할당된 파티션을 다른 컨슈머에게 할당해주는 작업 = rebalance

- 컨슈머 그룹에 높은 가용성과 규모 가변성을 제공하는 기능이기 떄문에 중요
- 문제없이 작업이 수행되고 있는 와중이라면 문제가 발생할 수도 있음
- 컨슈머 그룹이 사용하는 파티션 할당 전략에 따라 크게 2가지 종류의 리밸런스가 있음

#### 조급한 리밸런스 (p87, 그림 4-6)

- 리밸런스가 실행되는 와중에 모든 컨슈머는 읽기 작업을 멈추고 자신에게 할당된 파티션의 소유권을 포기한 뒤, 컨슈머 그룹에 다시 참여하여 완전히 새로운 파티션을 할당 받는 방식
- 위와 같은 동작은 전체 컨슈머 그룹에 대해 짧은 시간 동안 작업을 멈추게 함
  - 작업이 중단되는 시간의 길이는 컨슈머 그룹의 크기 및 여러 설정 매개변수에 영향을 받음

#### 협력적 리밸런스 (p88, 그림 4-7)

- 한 컨슈머에게 할당되어 있던 파티션만을 다른 컨슈머에 재할당
- 위 과정에 참여하지 않는 컨슈머들은 작업에 방해받지 않고 하던일을 계속할 수 있음
- 컨슈머 그룹 리더는 다른 컨슈머들에게 각자에게 할당된 파티션 중 일부가 재할당될 것이라고 통보 → 컨슈머들은 해당 파티션에서 데이터를 읽어오는 작업을 멈추고 해당 파티션에 대한 소유권을 포기 → 컨슈머 그룹
  리더가 이 포기된 파티션을 새로 할당
- 위와 같은 과정은 안정적으로 파티션이 할당될 때까지 몇 번 반복 가능하지만, 전체 작업이 중단되는 일은 발생하지 않음
  - 리밸런싱 작업에 상당한 시간이 걸릴 위험이 있는 컨슈머 그룹에 속한 컨슈머가 많은 경우에 특히 중요
- 카프카 3.1 부터 협력적 리밸런스가 기본값이 됨 (2.4부터는 조급한 리밸런스가 기본값이었음)

  컨슈머는 해당 컨슈머 그룹의 그룹 코디네이터 역할을 부여받은 카프카 브로커에 하트비트를 전송함으로써 멤버십과 할당된 파티션에 대한 소유권을 유지

- 하트비트는 컨슈머의 백그라운드 스레드에 의해 전송되며, 일정한 간격을 두고 전송되는 한 연결이 유지되고 있음으로 간주됨
- 컨슈머가 일정 시간 이상 하트비트를 전송하지 않는다면?
  - 세션 타임아웃이 발생하면서 그룹 코디네이터는 해당 컨슈머가 죽었다고 간주하고 리밸런싱을 수행

#### 파티션은 어떻게 컨슈머에게 할당되는가?

- 컨슈머가 그룹에 참여하고 싶을 때 그룹 코디네이터에게 JoinGroup 요청을 보냄
- 가장 먼저 참여한 컨슈머가 그룹 리더가 됨
  - 리더는 그룹 코디네이터로부터 해당 그룹 안에 있는 모든 컨슈머의 목록을 받아서 각 컨슈머에게 파티션의 일부를 할당해 줌
- 파티션 할당이 결정되면 컨슈머 그룹 리더는 할댕 내역을 그룹 코디네이터에게 전달하고 그룹 코디네이터는 다시 이 정보를 모든 컨슈머에게 전파
  - 각 컨슈머 입자에서는 자기에게 할당된 내역만 보임
  - 즉 리더만 클라이언트 프로세스 중에서 유일하게 그룹 내 컨슈머와 할당 내역 전부를 볼 수 있음
- 이 과정은 리밸런스가 발생할 때마다 반복적으로 수행됨

#### 정적 그룹 멤버십

- 컨슈머가 갖는 컨슈머 그룹의 멤버로서의 자격(멤버십)은 일시적
  - 컨슈머 그룹을 떠나는 순간 해당 컨슈머에 할당된 파티션은 해제됨
  - 이 후 해당 컨슈머가 다시 그룹에 참여하면 새로운 멤버 ID가 발급되면서 리밸런스 프로토콜에 의해 새로운 파티션이 할당됨
- `group.instance.id` 에 고유한 값을 부여하지 않는 이상 일시적으로 멤버십이 유지됨
  - 해당 설정을 고정값으로 설정하면 정적 멤버십을 부여받음
  - 정적 멤버로써 그룹에 처음 참여하면 파티션 할당 전략에 따라 파티션이 할당됨
  - 하지만 해당 멤버(정적 멤버십를 가진 컨슈머)가 꺼질 경우, 자동으로 그룹을 떠나지 않음
    - 세션 타임아웃이 경과될 때까지 여전히 그룹 멤버로 남아 있게됨
    - 컨슈머가 다시 그룹에 조인하면 멤버십이 유지되므로 리밸런스가 발생하지 않고 예전에 할당받았던 파티션을 그대로 다시 할당받음
- 정적 그룹 멤버십은 애플리케이션이 각 컨슈머에 할당된 파티션의 내용물을 사용해서 로컬 상태나 캐시를 유지해야 할 때 편리함
  - 캐시를 재생성하는 것이 시간이 오래걸릴 때 컨슈머가 재시작 할 때마다 이 작업을 반복한다면 지옥이 기다리고 있음
- 그러나 정적 그룹 멤버십을 사용한다면 해당 멤버십을 가진 컨슈머가 그룹에서 떠나있는 시간동안 해당 멤버십에 할당된 파티션의 메시지는 처리되지 않고 해당 컨슈머가 다시 그룹에 참여했을 때 처리되는 단점이 있으므로
  밀린 메시지를 빠르게 처리하여 최신 메시지까지 따라올 수 있는지에 대해 검증할 필요가 있음

#### 카프카 컨슈머 생성하기

```kotlin
val props = Properties()
props.put("bootstrap.servers", "broker1:9092,broker2:9092")
props.put("group.id", "io.jaewon.event.group.1")
props.put("key.deserializer", "...생략...StringSerializer")
props.put("value.deserializer", "...생략...StringSerializer")

val consumer = KafkaConsumer<String, String>(props)
```

- 프로듀서 설정과 모두 동일
- 딱 하나 다른 점은 `group.id` 를 부여한다는 점
  - 해당 값은 특정 컨슈머 그룹마다 고유해야 함

### 4.3 토픽 구독하기

컨슈머를 생성하고나서 다음 할 일은 1개 이상의 토픽을 구독하는 것이다.

```kotlin
val props = Properties()
props.put("bootstrap.servers", "broker1:9092,broker2:9092")
props.put("group.id", "io.jaewon.event.group.1")
props.put("key.deserializer", "...생략...StringSerializer")
props.put("value.deserializer", "...생략...StringSerializer")

val consumer = KafkaConsumer<String, String>(props)

val topic1 = "io.jaewon.event.sample.subdomain3"
// 구독 시작
consumer.subscribe(Collections.singletonList(topic1))
```

- `subscribe()` 메소드에 1..N 개의 토픽 목록을 전달할 수 있음
- 정규식을 매개변수로 하여 `subscribe()` 메소드를 호출할 수도 있음
  - 정규식은 다수의 토픽 이름과 매치될 수 있음
  - 새로운 토픽이 해당 정규식에 매치된다면?
    - 위 토픽이 생성될 때 바로 리밸런스가 발생하면서 컨슈머들은 새로운 토픽으로부터의 읽기 작업을 수행하게 됨
  - 다수의 토픽에서 레코드를 읽어와서 토픽이 포함하는 서로 다른 유형의 데이터를 처리해야할 때 유용하게 사용할 수 있음
  - 정규식을 사용해서 다수의 토픽을 구독하는 것은 카프카와 다른 시스템 사이에 데이터를 복제하는 애플리케이션이나 스트림 처리 애플리케이션에서 흔하게 사용하는 기법
  - 코드 예제

      ```kotlin
      // 구독 시작
      consumer.subscribe(Pattern.compile("io.jaewon.event.test.*"))
      ```

### 4.4 폴링 루프

컨슈머 API의 핵심은 서버에 추가 데이터가 들어왔는지 폴링하는 단순한 루프이다.

```kotlin
val timeout = Duration.ofMillis(100L)

while (true) {
  val records: ConsumerRecords<String, String> = consumer.poll(timeout)
  for (record in records) {
    println("... 생략 ... 프린트하고 싶은것 찍음")
    val updated = 1
    if (contryMap.containsKey(record.value()) {
        updated = contryMap[record.value()] + 1
      }
      contryMap [record.value()] = updated
  }
}
```

- `poll()` 메소드
  - 주기적으로 `poll()` 메소드를 호출하지 않을 경우 카프카는 해당 컨슈머를 죽은 것으로 간주하고 할당된 파티션을 다른 컨슈머에게 이관
  - 매개변수인 타임아웃의 경우
    - 0으로 지정되었거나 버퍼 안에 이미 레코드가 준비되어 있을 경우 바로 리턴
    - 위 경우가 아니라면 지정된 타임아웃 시간만큼 기다림
  - 레코드가 저장된 `List` 를 리턴
    - 레코드는 토픽, 파티션, 파티션에서의 오프셋, 키, 밸류 값을 포함한다.
    - 통상적으로 해당 List 를 순회하며 각 레코드를 처리하는 형태로 애플리케이션을 작성
  - `poll()` 메소드를 최초 호출하게 되면 컨슈머는 그룹 코디네이터를 찾아서 그룹에 참가 → 파티션을 할당 받음
    - 리밸런스 역시 연관된 콜백들과 함께 이 메소드에서 함께 처리됨
    - 즉, 컨슈머 혹은 콜백에서 뭔가 잘못될 수 있는 거의 모든 것들은 `poll()` 에서 예외로 발생됨
  - `max.poll.interval.ms` 에 지정된 시간 이상으로 `poll()` 메소드가 호출되지 않는다면 컨슈머는 죽은 것으로 판단되어 그룹에서
    퇴출된다. (이후에 리밸런싱이 일어남)
    - 따라서 `poll()` 을 처리하는 폴링 루프 안에서 예측 불가능한 형태로 스레드가 블록되는 작업을 수행하는 것은 피해야 함
- 스레드 안정성 (이 부분은 책으로 갈음. p94 4.4.1항 참고)

### 4.6 오프셋과 커밋

`poll()` 메소드를 호출할 때마다 카프카에 쓰여진 메시지 중에서 컨슈머 그룹에 속한 컨슈머들이 아직 읽지 않은 레코드가 리턴된다.
(이는 반대로 이야기하면 이를 이용해서 그룹 내의 컨슈머가 어떤 레코드를 읽었는지 판단할 수 있다는 이야기이다)

카프카의 고유한 특성 중 하나는 전통적인 JMS 스펙의 메시지 큐들이 하는 것처럼 컨슈머로부터 응답을 받는 방식이 아니라는 점이다.
대신, 컨슈머가 카프카를 사용해서 각 파티션에서의 위치를 추적할 수 있게 한다.

- 카프카에서는 파티션에서의 현재 처리 위치를 업데이트하는 작업을 오프셋 커밋이라고 함
  - 전통적인 메시지 큐와는 다르게 레코드를 개별적으로 커밋하지 않음
  - 대신, 컨슈머는 파티션에서 성공적으로 처리한 마지막 메시지를 커밋함으로써 그 앞의 메시지들 역시 성공적으로 처리되었음을 암묵적으로 나타냄
    - 이 부분 때문에 리밸런싱이 발생할 경우 중복처리 혹은 메시지 누락이 발생할 수 있음
    - p103, 그림 4-8 ~ 4-9 참조
- 오프셋 커밋은 `poll()` 메소드가 리턴한 마지막 오프셋 바로 다음 오프셋을 커밋하는 것이 기본적인 작동임을 명심하자.

#### 자동 커밋

- 오프셋을 커밋하는 가장 쉬운 방법 = 컨슈머가 대신하도록 하는 것
- `enable.auto.commit = true` 로 설정하면 컨슈머는 5초에 한번 `poll()`을 통해 받은 메시지 중 마지막 메시지의 오프셋을 커밋함
  - `auto.commit.interval.ms` 설정을 변경하면 5초마다 커밋하는 시간을 변경할 수 있다.
- 자동 커밋의 경우 자동 커밋 주기 동안 컨슈머에 크래시가 발생한다면 (이벤트를 처리하는 도중 크래시) 레코드가 중복으로 처리될 수 있다는 것을 인지해야만 한다.
  - 즉, 자동커밋은 편리하지만 개발자가 중복 메시지를 방지하기엔 충분하지 않다.

#### 현재 오프셋 수동으로 커밋하기

- 개발자는 메시지 유실의 가능성을 제거하고 리밸런스가 발생했을 때 중복되는 메시지의 수를 줄이기 위하여 오프셋이 커밋되는 시각을 제어하는 것을 원한다.
- 컨슈머 API는 타이머 시간이 아닌, 애플리케이션 개발자가 원하는 시간에 현재 오프셋을 커밋하는 옵션을 제공한다.
  - `enable.auto.commit = false` 로 설정
  - 오프셋 커밋을 원하는 시점에 `commitSync()` 메소드를 호출
    - 해당 메소드는 가장 간단하고 신뢰성 있는 API
      - `poll()` 메소드에 의해 리턴된 마지막 오프셋을 커밋하는 기능을 내장함
    - `poll()` 에서 리턴된 모든 레코드의 처리가 완료되기 전에 해당 메소드를 호출한다면?
      - 애플리케이션이 크래시 되었을 때 커밋은 되었지만, 아직 처리되지 않은 메시지들이 누락될 수 있다는 점을 감수해야 한다.
    - 예시

        ```kotlin
        val timeout = Duration.ofMillis(100L)
        
        while(true) {
          val records: ConsumerRecords<String, String> = consumer.poll(timeout)
          for (record in records) {
            println("... 생략 ... 프린트하고 싶은것 찍음")
            val updated = 1
            if (contryMap.containsKey(record.value()) {
              updated = contryMap[record.value()] + 1
            }
            contryMap[record.value()] = updated
          }
        
          try {
            consumer.commitSync()
          } catch (e: Exception) {
            ... 예외 처리 ...
          }
        }
        ```

      - 해당 예시에서는 모든 레코드 루프를 돌고 `commitSync()` 를 수행
        - 사례에 따라 `commitSync()` 의 위치를 결정할 필요가 있음
        - 해당 위치는 레코드의 처리가 언제 ‘완료’ 되었는가를 결정하는 것과 동일
      - 해결할 수 없는 에러가 발생하지 않는 한 `commitSync()` 메소드는 커밋을 재시도
        - 실제로 회복할 수 없는 오류가 발생할 경우 에러를 로깅하는 등의 처리 외에는 특별히 할 수 있는 것들이 많지 않음

#### 비동기적 커밋

- 수동 커밋의 단점 중 하나는 브로커가 커밋 요청에 응답할 때까지 애플리케이션이 블록된다는 점
  - 이는 애플리케이션의 처리량을 제한한다는 것과 동일한 의미
- 이를 극복하기 위하여 `commitAsync()`, 즉 비동기 커밋을 사용할 수 있음
- 예시

    ```kotlin
    val timeout = Duration.ofMillis(100L)
    
    while(true) {
    	val records: ConsumerRecords<String, String> = consumer.poll(timeout)
    	for (record in records) {
    		println("... 생략 ... 프린트하고 싶은것 찍음")
    		val updated = 1
    		if (contryMap.containsKey(record.value()) {
    			updated = contryMap[record.value()] + 1
    		}
    		contryMap[record.value()] = updated
    	}
    	consumer.commitAsync()
    }
    ```

  - 이 방식의 단점은 `commitSync()` 와 달리 재시도를 하지 않는다는 점
    - `commitAsync()` 가 서버로부터 응답을 받은 시점에는 이미 다른 커밋 시도가 성공했을 수도 있기 때문임
    - p106 예시 참조
  - 비동기 커밋 방식에서 오프셋을 올바른 순서로 커밋하는 문제의 복잡성과 중요성에 대해 언급하는 이유?
    - `commitAync()` 는 브로커에서 보낸 응답을 받았을 때 호출되는 콜백을 지정할 수 있는 옵션이 있기 때문
    - 이 콜백은 커밋 에러를 로깅 혹은 커밋 에러 수 집계 등을 수행하는 것이 일반적이지만 재시도를 하기 위해 콜백을 사용하는 경우도 있으므로 이 경우 커밋 순서 관련된 문제에 주의를 기울여야 함.
      - 비동기적 커밋을 재시도하려면?
        - 순차적으로 단조증가하는 번호를 사용하면 비동기적 커밋을 재시도 할 때 순서를 맞출 수 있음
        - 커밋할 때마다 번호를 1씩 증가시키고 commitAsync 콜백에 해당 번호를 넣어준다
        - 재시도 요청을 보낼 준비가 되었을 때 콜백에 준비된 번호와 현재 번호를 비교해주는 로직을 사용
        - p107 참조