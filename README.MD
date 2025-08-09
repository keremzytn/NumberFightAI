1. Proje Tanımı
Card Duel 1-7, 1’den 7’ye numaralı kartlarla oynanan, 7 raund süren iki kişilik bir mobil kart oyunudur. Oyuncular karşılıklı olarak kart seçerek puan kazanmaya çalışır. Oyun, hem tek oyunculu (AI) hem de çok oyunculu (online) modlarda oynanabilir.

2. Amaç
* Basit ama stratejik bir kart oyunu sunmak.
* Farklı zorluk seviyelerinde yapay zeka ile oynanabilmesini sağlamak.
* Gerçek zamanlı çok oyunculu deneyim sunmak.
* Arkadaşlar arasında dostluk maçı yapılabilmesi.

3. Hedef Kitle
* 13 yaş ve üzeri mobil oyuncular
* Kısa süreli stratejik oyun sevenler
* Çevrimiçi ve çevrimdışı kart oyunlarına ilgi duyan kullanıcılar

4. Oyun Mekanikleri
4.1 Genel Kurallar
1. Her oyuncu [1, 2, 3, 4, 5, 6, 7] kartlarından oluşan bir deste ile başlar.
2. Oyun 7 raund sürer.
3. Her raundda her oyuncu kalan kartlarından 1 tanesini seçer.
4. Puanlama:
    * Daha büyük kart oynayan raundu kazanır ve 1 puan alır.
    * Aynı kart oynanırsa puan verilmez.
5. Oyun sonunda puanı yüksek olan kazanır.
6. Beraberlik durumunda oyun berabere biter.

4.2 Kural 1 (Kart Tekrarı Yasağı)
* Bir kart kullanıldıktan sonra tekrar kullanılamaz.
4.3 Kural 2 (Komşu Kart Kilidi)
* Bir oyuncu bir raundda bir kart oynadığında, bir sonraki raund o kartın 1 eksiğini ve 1 fazlasını oynayamaz.
    * Örnek: 4 oynandıysa → 3 ve 5 bir raund boyunca kullanılamaz.
4.4 Özel Durum: 5. Raund İstisnası
* Eğer 5. raund başında oyuncunun elinde ardışık 3 sayı varsa (örn: 3-4-5) ve ortadaki kart (örn: 4) oynanırsa, 6. raundda komşu kart kilidi uygulanmaz.

5. Oyun Modları
5.1 Tek Oyunculu (Bilgisayara Karşı)
* Farklı zorluk seviyeleri: Kolay, Orta, Zor
* Yapay zeka kural tabanlı strateji uygular.
5.2 Çevrimiçi Rastgele Eşleşme
* Sunucu üzerinden o anda çevrimiçi olan oyuncular eşleştirilir.
* Gerçek zamanlı hamle gönderimi.
5.3 Arkadaş Maçı
* Oyun kodu veya davet linki ile arkadaş davet edilir.
* Gerçek zamanlı eşleşme.

6. Oyun Akışı
1. Ana Menü
    * Oyun Modu Seçimi (Tek Oyunculu, Çevrimiçi, Arkadaş Maçı)
    * Ayarlar (Ses, Grafik, Kullanıcı Adı)
    * İstatistikler
2. Oyun Başlangıcı
    * Oyunculara 7 kart gösterilir.
    * Raund başında 30 saniyelik seçim süresi başlar.
3. Hamleler
    * Oyuncu kartını seçer → rakibin seçimi beklenir.
    * Kartlar açılır, kazanan belirlenir, puan eklenir.
4. Raund Sonu
    * Kullanılan kartlar kaldırılır.
    * Kural 2’ye göre kilitli kartlar işaretlenir.
        5. raund özel durumu kontrol edilir.
5. Oyun Sonu
    * Puanlar karşılaştırılır, kazanan açıklanır.
    * Tekrar oyna veya ana menü seçenekleri.

7. Yapay Zeka Mantığı
* Kolay: Rastgele kart seçer, sadece kurallara uyar.
* Orta: Rakip geçmiş hamlelerini dikkate alır, %30 yanlış tahmin yapar.
* Zor: Rakip kartlarını takip eder, kazanma ihtimali en yüksek kartı seçer, 5. raund özel kuralını akıllıca uygular.

8. Teknik Gereksinimler
8.1 Platform
* iOS ve Android (React Native)
8.2 Çevrimiçi Mod
* WebSocket tabanlı gerçek zamanlı bağlantı
* Sunucu tarafında .NET Core altyapısı
* Veritabanı PostgreSQL
8.3 Veri Saklama
* Kullanıcı istatistikleri
* Arkadaş listesi
* Maç geçmişi

9. UI/UX Gereksinimleri
* Kart Tasarımı: Basit, anlaşılır numaralar
* Zaman Göstergesi: Geri sayım çubuğu
* Puan Tablosu: Her raund sonunda güncellenen skor
* Kilitli Kart Göstergesi: Gri ton veya kilit ikonu
* Raund Sayacı: 1/7, 2/7 şeklinde gösterim

10. Riskler & Çözümler
Risk	Çözüm
Oyuncular çevrimiçi modda terk edebilir	Otomatik AI devralma
Kural 2 anlaşılmayabilir	İlk oyunda kısa öğretici ekleme
Ağ gecikmeleri	Hamle doğrulama için sunucu senkronizasyonu

11. Başarı Kriterleri
* Günlük aktif kullanıcı (DAU) hedefi: 5.000
* Ortalama oyun süresi: < 3 dakika
* Tekrar oynama oranı: %40+
* Çevrimiçi mod gecikme: < 200 ms
