---
title: "[JPA] @Transactional μ΅μ μ λ¦¬"
date: '2022-02-15'
category: 'spring'
description: ''
emoji: 'π§Ί'
---

> JPAλ₯Ό νμ©ν  λ, `@Transactional`μ κ° μ΅μλ€μ λν΄ μ νν μκ³  μ¬μ©νλ €κ³  νλ€.
> 
> λ°λΌμ κ° κΈ°μ μ λν΄ κ³΅λΆν΄λ³΄μλ€.

---

# @Transactional μ μ΅μ

Spring μμ `@Transactional` μ μ¬μ©ν  λ μ§μ ν  μ μλ μ΅μλ€μ μλμ κ°λ€.

- [isolation](https://won0935.github.io/category/spring/transactional-isolation/)
- [propagation](https://won0935.github.io/category/spring/transactional-propagation/)
- readOnly
- rollbackFor
- timeout


## @Transactional(readOnly= ?)

```java
@Transactional(readOnly = true)
public void doSomething(){...}
```

- **κΈ°λ³Έκ°**μ `false` μ΄λ©° `true` λ‘ μΈννλ κ²½μ° νΈλμ­μμ **μ½κΈ° μ μ©**μΌλ‘ λ³κ²½νλ€.
- λ§μ½ μ½κΈ° μ μ© νΈλμ­μ λ΄μμ INSERT, UPDATE, DELETE μμμ ν΄λ λ°μμ΄ λμ§ μκ±°λ DB μ’λ₯μ λ°λΌμ μμ μμΈκ° λ°μνλ κ²½μ°κ° μλ€. (MySQLμ κ²½μ° μ€λ₯μ¬ν­ μμ΄ λ°μ΄ν° λ°μμ΄ λμ§ μμ)
- `@Transaction(readOnly = true)`λ‘ μ€μ νλ©΄ **μ½κΈ° μ±λ₯ ν₯μμ μ₯μ **μ΄ μλ€.
- μ½κΈ° μΈμ λ€λ₯Έ λμμ λ°©μ§νκΈ° μν΄ μ¬μ©νκΈ°λ νλ€.


#### @Transaction(readOnly = true) κ° λ λΉ λ₯Έ μ΄μ 
> **Dirty Checking** μ νμ§ μκΈ° λλ¬Έ
 1. JPA μλ Dirty Checking μ΄λΌλ κΈ°λ₯μ΄ μλ€.
 2. κ°λ°μκ° μμλ‘ UPDATE μΏΌλ¦¬λ₯Ό μ¬μ©νμ§ μμλ νΈλμ­μ μ»€λ° μμ 1μ°¨ μΊμμ μ μ₯λμ΄ μλ Entity μ μ€λμ·μ λΉκ΅ν΄μ λ³κ²½λ λΆλΆμ΄ μμΌλ©΄ UPDATE μΏΌλ¦¬λ₯Ό λ λ €μ£Όλ κΈ°λ₯μ΄λ€.
 3. readOnly = true μ΅μμ μ£Όλ©΄ μ€νλ§ νλ μμν¬κ° νμ΄λ²λ€μ΄νΈμ FlushMode λ₯Ό MANUAL λ‘ μ€μ ν΄μ Dirty Checking μ νμν μ€λμ· λΉκ΅ λ±μ μλ΅νκΈ° λλ¬Έμ μ±λ₯μ΄ ν₯μλλ€.


## @Transactional(rollbackFor= ?)

```java
@Transactional(rollbackFor = {IOException.class, ClassNotFoundException.class})
public void doSomething(){...}
```

- κΈ°λ³Έκ°μ `RuntimeException`, `Error` μ΄λ©°, κΈ°λ³Έμ μΌλ‘ νΈλμ­μμ μ’λ£ μ λ³κ²½λ λ°μ΄ν°λ₯Ό μ»€λ°νλ€.
- νμ§λ§ @Transactional μμ rollbackFor μμ±μ μ§μ νλ©΄ **νΉμ  Exception λ°μ μ λ°μ΄ν°λ₯Ό μ»€λ°νμ§ μκ³  λ‘€λ°±νλλ‘ λ³κ²½**ν  μ μλ€.
- rollbackFor μμ±μΌλ‘ λ€λ₯Έ Exception μ μΆκ°ν΄λ RuntimeException μ΄λ Error λ μ¬μ ν λ°μ΄ν°λ₯Ό λ‘€λ°±νλ€.
- λ§μ½ κ°μ λ‘ λ°μ΄ν° λ‘€λ°±μ λ§κ³  μΆλ€λ©΄ `noRollbackFor` μ΅μμΌλ‘ μ§μ ν΄μ£Όλ©΄ λλ€.

## @Transactional(timeout= ?)

```java
@Transactional(timeout = 2)
public void doSomething(){...}
```

- **κΈ°λ³Έκ°μ -1**(λ¬΄ν)μ΄λ©°, μ§μ ν μκ° λ΄μ ν΄λΉ λ©μλ μνμ΄ μλ£λμ΄ μμ κ²½μ° `JpaSystemException` μ λ°μμν¨λ€.
- `JpaSystemException` μ `RuntimeException` μ μμλ°κΈ° λλ¬Έμ λ°μ΄ν° μ­μ **λ‘€λ°± μ²λ¦¬** λλ€.
- **μ΄ λ¨μ**λ‘ μ§μ ν  μ μμΌλ©° κΈ°λ³Έκ°μΈ -1 μΈ κ²½μ°μ timeout μ μ§μνμ§ μλλ€.