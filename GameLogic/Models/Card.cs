namespace CardGame.Models
{
    public class Card
    {
        public int Value { get; set; }
        public bool IsLocked { get; set; }
        public bool IsUsed { get; set; }

        public Card(int value)
        {
            Value = value;
            IsLocked = false;
            IsUsed = false;
        }

        public Card Clone()
        {
            return new Card(Value)
            {
                IsLocked = this.IsLocked,
                IsUsed = this.IsUsed
            };
        }
    }
}