---
title: "어댑터 & 파사드 패턴"
date: '2021-11-23'
categories: [ 설계, 다자인패턴 ]
---

## 🧤 어댑터 & 파사드 패턴이란

### 어댑터 패턴

> 한 클래스의 인터페이스를 클라이언트에서 사용하고자하는 다른 인터페이스로 **변환**한다.
> 어댑터를 이용하면 인터페이스 **호환성** 문제 때문에 같이 쓸 수 없는 클래스들을 연결해서 쓸 수 있다.

### 파사드 패턴

> 어떤 서브시스템의 일련의 인터페이스에 대한 **통합된 인터페이스**를 제공한다.
> 퍼사드에서 고수준 인터페이스를 정의하기 때문에 서브시스템을 더 쉽게 사용할수 있다.

---

## 🔧 어댑터 패턴의 이해

![image](https://user-images.githubusercontent.com/55419159/140725965-84c06d1c-050a-4c09-bbe1-73d91d037601.png)

![image](https://user-images.githubusercontent.com/55419159/140726207-74aafe97-0197-473f-84ad-e3ed5bea9407.png)

### 🚀 활용 예시

_칠면조를 오리로 변환하기 위해서는... (둘다 새이긴 하니까)_

> Duck 객체가 모자라서 Turkey 객체를 대신 사용해야 하는 상황이라고 해보자.
> 인터페이스가 다르기 때문에 Turkey객체를 바로 사용할 수는 없다.
> 어댑터를 만들어 보자.

#### 오리 인터페이스

```java
public interface Duck {
  public void quack(); //오리는 꽥꽥

  public void fly();
}
```

#### 오리 구현체

```java
public class MallardDuck implements Duck {
  @Override
  public void quack() {
    System.out.println("Quack");
  }

  @Override
  public void fly() {
    System.out.println("I'm flying");
  }
}
```

#### 칠면조 인터페이스

```java
public interface Turkey {
  public void gobble(); //칠면조는 이렇게 운다..

  public void fly();
}
```

#### 칠면조 구현체

```java
public class WildTurkey implements Turkey {
  @Override
  public void gobble() {
    System.out.println("Gobble gobble");
  }

  @Override
  public void fly() {
    System.out.println("I'm flying a short distance");
  }
}
```

#### **어댑터 구현**

```java
public class TurkeyAdapter implements Duck { //오리인터페이스를 구현한다.
  Turkey turkey;

  public TurkeyAdapter(Turkey turkey) { //생성자에서 칠면조를 받는다.
    this.turkey = turkey;
  }

  @Override
  public void quack() {
    turkey.gobble(); //변환 작업
  }

  @Override
  public void fly() {
    turkey.fly();
  }
}
```

#### 실행

```java
public class DuckTestDrive {

  public static void main(String[] args) {

    MallardDuck duck = new MallardDuck();
    WildTurkey turkey = new WildTurkey();

    Duck turkeyAdapter = new TurkeyAdapter(turkey);

    System.out.println("The turkey says...");

    turkey.gobble();
    turkey.fly();

    System.out.println("The Duck says...");
    testDuck(duck);

    System.out.println("The TurkeyAdapter says...");
    testDuck(turkeyAdapter);
  }

  public static void testDuck(Duck duck) {
    duck.quack();
    duck.fly();
  }
}

```

### 🚌 정리

- 클라이언트 -> `request()` -> 어댑터 - `translatedRequest()` -> 어댑티.
- 클라이언트는 타겟 인터페이스에 맞게 구현, 어댑터는 타겟 인터페이스를 구현하며, 어댑티 인스턴스가 들어있음.

---

## 🗿 파사드 패턴의 이해

> 패턴을 사용할때는 항상 패턴이 어떤 용도로 쓰이는지를 잘 알아둬야 한다.
> 퍼사드 패턴은 단순화된 인터페이스를 통해서 서브시스템을 더 쉽게 사용할 수 있도록 하기위한 용도로 쓰인다.

![image](https://user-images.githubusercontent.com/55419159/140728533-8bf247c6-484d-4375-9746-d49960e445c3.png)

### 💿 DVD영화를 보려고하면..

> 홈씨어터로 퍼사드 패턴을 구현해보자.
> 전선과 프로젝터를 설치하고, 각 장치들을 케이블로 연결하고 등등 여러 인터페이스들이 나열되어 있다.

![image](https://user-images.githubusercontent.com/55419159/140728598-7bcbeb79-d888-413f-bca6-368863c1e56d.png)

```java
1.팝콘 기계를켠다.
  2.팝콘 튀기기 시작.
  3.전등을 어둡게 조절
  4.스크린을 내린다.
  ..
  ..
  12.DVD 플레이어를 켠다
  13.DVD를 재생한다.

  poper.on();
  poper.pop();
  light.dim(10)
  screen.down();
  .....
  dvd.on();
  dvd.play(movie);
```

> _너무 복잡하다... 버튼하나로 모든 세팅이 끝나게 할 수는 없을까?_

- 이런 경우에 퍼사드를 사용하면 된다.
- 퍼사드 패턴은 **인터페이스를 단순화시키기 위해서** 인터페이스를 변경한다.
- **통합 인터페이스**를 제공하는 **퍼사드 클래스**를 구현함으로써 복잡한 시스템을 훨씬 쉽게 사용할 수 있다.

```java
public class HomeTheaterFacade { //영화 세팅의 모든것이 담겨있는 파사드 객체
  Amplifier amp;
  Tuner tuner;
  Dvdplayer dvd;
  CdPlayer cd;
  Projector projector;
  TheaterLights lights;
  Screen screen;
  PopcornPopper popper;

  public HomeTheaterFacade(Amplifier amp,
                           Tuner tuner,
                           DvdPlayer dvd,
                           CdPlayer cd,
                           Projector projector,
                           Screen screen,
                           TheaterLights lights,
                           PopcornPopper popper) {
    this.amp = amp;
    this.tunner = tuner;
    this.dvd = dvd;
    this.cd = cd;
    this.projector = projector;
    this.screen = screen;
    this.lights = lights;
    this.popper = popper;
  }

  public void watchMovie(String movie) {  //영화를 보고싶으면 그냥 이 메소드만 호출하면 된다!
    System.out.println("Get ready to watch a movie...");
    popper.on();
    popper.pop();
    lights.dim(10);
    screen.down();
    projector.on();
    projector.wideScreenMode();
    amp.on();
    amp.setDvd(dvd);
    amp.setsurroundSound();
    amp.setVolume(5);
    dvd.on();
    dvd.play(movie);
  }

  public void endMovie() { //끌 때도 마찬가지!
    System.out.println("Shutting movie theater down...");
    popper.off();
    lights.on();
    screen.up();
    projector.off();
    amp.off();
    dvd.stop();
    dvd.eject();
    dvd.off();
  }
}

public class HomeTheaterTestDrive {
  public static void main(String[] args) {
    // instantiate components here
    HomeTheaterFacade homeTheater =
      new HomeTheaterFacade(amp, tuner, dvd, cd, projector, screen, lights, popper);
    homeTheater.watchMovie("타짜");
    homeTheater.endMovie();
  }
}
```

---

## 💰 최소지식원칙

> _'정말 친한 친구하고만 얘기하라'_

어떤 객체든 그 객체와 상호작용을 하는 클래스의 개수에 주의해야 하며, 그런 객체들과 어떤 식으로 상호작용을 하는지에도 주의를 기울여야 한다는 뜻이다.

### ⚙️ 최소지식원칙을 지키는 방법

어떻게 하면 여러 객체하고 인연을 맺는 것을 피할 수 있을까
어떤 메소드에서든지 아래와 같은 **네 종류**의 객체의 `메소드`만을 호출하면 된다.

1. 객체 **자체**
2. 메소드에 **매개변수**로 전달된 객체
3. 그 메소드에서 생성하거나 **인스턴스**를 만든 객체
4. 그 객체에 속하는 **구성요소**

### 🥊 활용 예시

#### 원칙을 따르지 않은 경우

```java
public float getTemp(){
  Thermometer thermometer=station.getThermometer(); // station 오로부터 thermometer라는 객체를 받은다음
  return thermometer.getTemperature(); //그 갹체의 getTemperature()메소드를 직접 호출.
  }
```

#### 원칙을 따르는 경우

```java
public float getTemp(){
  return station.getTemperature(); // Station 클래스에 thermometer에 요청을 해주는 메소드를 추가
  // 이렇게 하면 의존해야 하는 클래스의 개수를 줄일수 있다.
  }
```

#### 자동차로 예시를 들면

```java
public class Car {
  Engine engine; //이 클래스의 구성요소. 이 구성요소의 메소드는 호출해도 된다.

  public Car() {
  }

  public void start(Key key) { // 매개변수로 전달된 객체의 메소드는 호출해도 된다.

    Doors doors = new Doors(); //새로운 객체 생성. 이 객체의 메소드는 호출해도 된다.
    boolean authorized = key.turns(); //매개변수로 전달된 객체의 메소드는 호출해도 된다.

    if (authorized) {
      engine.start(); // 이 객체의 구성요소의 메소드는 호출해도 된다.
      updateDashboardDisplay(); // 객체 내에 있는 메소드는 호출해도 된다.
      doors.lock(); //직접 생성하거나 인스턴스를 만든 객체의 메소드는 호출해도 된다.
    }
  }

  public void updateDashboardDisplay() {
  }
}
```



