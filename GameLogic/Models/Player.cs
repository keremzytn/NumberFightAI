using System.Collections.Generic;
using System.Linq;

namespace CardGame.Models
{
    public class Player
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Avatar { get; set; }
        public List<Card> Hand { get; set; }
        public int Score { get; set; }
        public bool IsAI { get; set; }
        public AILevel AILevel { get; set; }
        public PlayerStatistics Statistics { get; set; }
        public List<int> PlayedCards { get; set; } // History of played cards

        public Player(string id, string name, string email = null)
        {
            Id = id;
            Name = name;
            Email = email;
            Hand = new List<Card>();
            Score = 0;
            IsAI = false;
            AILevel = AILevel.None;
            Statistics = new PlayerStatistics();
            PlayedCards = new List<int>();
        }

        public void InitializeHand()
        {
            Hand.Clear();
            for (int i = 1; i <= 7; i++)
            {
                Hand.Add(new Card(i));
            }
        }

        public List<Card> GetAvailableCards()
        {
            return Hand.Where(c => !c.IsUsed && !c.IsLocked).ToList();
        }

        public bool CanPlayCard(int cardValue)
        {
            var card = Hand.FirstOrDefault(c => c.Value == cardValue);
            return card != null && !card.IsUsed && !card.IsLocked;
        }

        public void PlayCard(int cardValue)
        {
            var card = Hand.FirstOrDefault(c => c.Value == cardValue);
            if (card != null && CanPlayCard(cardValue))
            {
                card.IsUsed = true;
                PlayedCards.Add(cardValue);
            }
        }

        public void UnlockAllCards()
        {
            foreach (var card in Hand)
            {
                card.IsLocked = false;
            }
        }

        public void LockNeighborCards(int playedCardValue)
        {
            var lowerNeighbor = Hand.FirstOrDefault(c => c.Value == playedCardValue - 1);
            var upperNeighbor = Hand.FirstOrDefault(c => c.Value == playedCardValue + 1);

            if (lowerNeighbor != null && !lowerNeighbor.IsUsed)
                lowerNeighbor.IsLocked = true;

            if (upperNeighbor != null && !upperNeighbor.IsUsed)
                upperNeighbor.IsLocked = true;
        }
    }

    public enum AILevel
    {
        None,
        Easy,
        Medium,
        Hard
    }

    public class PlayerStatistics
    {
        public int TotalGames { get; set; }
        public int Wins { get; set; }
        public int Losses { get; set; }
        public Dictionary<int, int> CardUsageCount { get; set; }
        public double WinRate => TotalGames > 0 ? (double)Wins / TotalGames : 0;
        public int MostUsedCard => CardUsageCount?.OrderByDescending(x => x.Value).FirstOrDefault().Key ?? 0;

        public PlayerStatistics()
        {
            CardUsageCount = new Dictionary<int, int>();
            for (int i = 1; i <= 7; i++)
            {
                CardUsageCount[i] = 0;
            }
        }

        public void RecordCardUsage(int cardValue)
        {
            if (CardUsageCount.ContainsKey(cardValue))
            {
                CardUsageCount[cardValue]++;
            }
        }

        public void RecordGameResult(bool won)
        {
            TotalGames++;
            if (won)
                Wins++;
            else
                Losses++;
        }
    }
}