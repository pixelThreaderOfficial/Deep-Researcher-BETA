import re
from collections import defaultdict, Counter
import pathlib

cwd = pathlib.Path(__file__).parent

class WordPredictor:
    def __init__(self, file_path="queries.txt"):
        self.file_path = file_path
        self.bigrams = defaultdict(Counter)
        self.trigrams = defaultdict(Counter)
        self.word_starts = Counter()
        self.sentence_patterns = defaultdict(Counter)
        self.trained = False

    def _clean_text(self, text):
        """Clean and normalize text"""
        # Convert to lowercase
        text = text.lower()
        # Remove extra whitespace
        text = re.sub(r"\s+", " ", text)
        # Keep letters, numbers, spaces, and basic punctuation 
        text = re.sub(r"[^\w\s\.\,\!\?\-]", "", text)
        return text.strip()

    def _tokenize(self, text):
        """Tokenize text into words"""
        # Split on whitespace and punctuation 
        words = re.findall(r"\b\w+\b", text)
        return words 

    def _extract_sentence_patterns(self, text):
        """Extract common sentence patterns and completions"""
        sentences = re.split(r"[.!?]+", text)
        patterns = [] 

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            words = self._tokenize(sentence)
            if len(words) < 2:
                continue

            # Extract patterns of different lengths
            for i in range(1, min(4, len(words))):
                pattern = " ".join(words[:i])
                completion = " ".join(words[i:])
                if completion:
                    patterns.append((pattern, completion))
        return patterns

    def train(self):
        """Train the model from the queries.txt file"""
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                content = f.read()
        except FileNotFoundError:
            print(f"Error: {self.file_path} not found!")
            return False
        except Exception as e:
            print(f"Error reading file: {e}")
            return False

        # Clean and split into lines
        lines = content.split("\n")

        for line in lines:
            if not line.strip():
                continue

            cleaned = self._clean_text(line)
            words = self._tokenize(cleaned)

            if len(words) < 2:
                continue

            # Track word starts (for when user starts typing)
            if words:
                self.word_starts[words[0]] += 1

            # Build bigrams (current word -> next word)
            for i in range(len(words) - 1):
                current = words[i]
                next_word = words[i + 1]
                self.bigrams[current][next_word] += 1

            # Build trigrams (two words -> next word)
            for i in range(len(words) - 2):
                key = (words[i], words[i + 1])
                next_word = words[i + 2]
                self.trigrams[key][next_word] += 1

            # Extract sentence patterns
            patterns = self._extract_sentence_patterns(cleaned)
            for pattern, completion in patterns:
                self.sentence_patterns[pattern][completion] += 1

        self.trained = True
        print(
            f"Training complete! Learned {len(self.bigrams)} unique words with {sum(len(v) for v in self.bigrams.values())} connections."
        )
        print(f"Extracted {len(self.sentence_patterns)} sentence patterns.")
        return True

    def _get_last_words(self, text, n=2):
        """Extract the last n words from input text"""
        cleaned = self._clean_text(text)
        words = self._tokenize(cleaned)
        return words[-n:] if len(words) >= n else words

    def _find_completions(self, partial_text, num_suggestions=5):
        """Find sentence completions based on partial text"""
        if not partial_text.strip():
            return []

        partial_lower = partial_text.lower().strip()
        completions = Counter()

        # Check if the last word is incomplete
        words = partial_lower.split()
        last_word = words[-1] if words else ""
        is_incomplete_word = (
            len(last_word) > 0 and len(last_word) < 10
        )  # Assume words longer than 10 are complete

        # PRIORITY 1: Word completion for the last word
        if is_incomplete_word and len(words) > 0:
            # Find words that start with the incomplete word
            word_completions = []
            for word in self.bigrams.keys():
                if word.startswith(last_word) and word != last_word:
                    word_completions.append(word)

            # Sort word completions by frequency in training data
            word_completions.sort(
                key=lambda w: sum(self.bigrams[w].values()), reverse=True
            )

            # Get the most likely word completions
            best_word_completions = word_completions[:3]  # Top 3 word completions

            for completed_word in best_word_completions:
                completed_text = " ".join(words[:-1] + [completed_word])

                # Check if completed word leads to good sentence patterns
                for pattern, completion_counts in self.sentence_patterns.items():
                    if pattern.startswith(completed_text):
                        for completion, count in completion_counts.items():
                            completions[completion] += (
                                count * 5
                            )  # Highest weight for word completion

                # Also try bigram prediction with completed word
                if completed_word in self.bigrams:
                    for next_word, count in self.bigrams[completed_word].items():
                        completions[next_word] += (
                            count * 4
                        )  # High weight for word completion + next word

        # PRIORITY 2: Direct pattern matching (only if no word completions found)
        if not completions:
            for pattern, completion_counts in self.sentence_patterns.items():
                if pattern.startswith(partial_lower):
                    for completion, count in completion_counts.items():
                        completions[completion] += count * 3

        # PRIORITY 3: Partial pattern matching
        if not completions:
            for pattern, completion_counts in self.sentence_patterns.items():
                if partial_lower in pattern or pattern.startswith(
                    partial_lower.split()[-1] if partial_lower.split() else ""
                ):
                    for completion, count in completion_counts.items():
                        completions[completion] += count

        # PRIORITY 4: Word-based prediction for continuation (fallback)
        if not completions:
            last_words = self._get_last_words(partial_text, 2)
            if last_words:
                # Try trigram prediction
                if len(last_words) >= 2:
                    key = tuple(last_words[-2:])
                    if key in self.trigrams:
                        for word, count in self.trigrams[key].items():
                            completions[word] += count * 2

                # Try bigram prediction
                if len(last_words) >= 1:
                    last_word = last_words[-1]
                    if last_word in self.bigrams:
                        for word, count in self.bigrams[last_word].items():
                            completions[word] += count

        return completions

    def getSentenceCompletions(self, input_text, num_suggestions=5):
        """
        Get sentence completion suggestions based on input text

        Args:
            input_text (str): The partial text to complete
            num_suggestions (int): Number of suggestions to return

        Returns:
            list: List of tuples (complete_sentence, predicted_tokens, confidence_score)
        """
        if not self.trained:
            if not self.train():
                return []

        if not input_text.strip():
            # If empty input, return common sentence starters
            suggestions = []
            for word, count in self.word_starts.most_common(num_suggestions):
                confidence = min(
                    10, max(1, int(count / max(self.word_starts.values()) * 10))
                )
                suggestions.append((word, word, confidence))
            return suggestions

        # Find completions
        completions = self._find_completions(input_text, num_suggestions)

        if not completions:
            # Fallback to word predictions
            last_words = self._get_last_words(input_text)
            if last_words:
                last_word = last_words[-1]
                if last_word in self.bigrams:
                    for word, count in self.bigrams[last_word].most_common(
                        num_suggestions
                    ):
                        confidence = min(
                            10,
                            max(
                                1,
                                int(count / max(self.bigrams[last_word].values()) * 10),
                            ),
                        )
                        complete_sentence = f"{input_text} {word}"
                        suggestions.append((complete_sentence, word, confidence))
                    return suggestions

                # Convert completions to suggestions
        suggestions = []
        if completions:
            max_count = max(completions.values())
            for completion, count in completions.most_common(num_suggestions):
                confidence = min(10, max(1, int(count / max_count * 10)))

                # Handle word completion with better logic
                words = input_text.lower().split()
                if words and len(words[-1]) < 10:  # Likely incomplete word
                    last_word = words[-1]

                    # Find the best word completion based on frequency and context
                    word_completions = []
                    for word in self.bigrams.keys():
                        if word.startswith(last_word) and word != last_word:
                            # Calculate score based on word frequency and context
                            word_freq = sum(self.bigrams[word].values())
                            context_score = 0

                            # Check if completed word leads to good sentence patterns
                            completed_text = " ".join(words[:-1] + [word])
                            for (
                                pattern,
                                completion_counts,
                            ) in self.sentence_patterns.items():
                                if pattern.startswith(completed_text):
                                    context_score += sum(completion_counts.values())

                            total_score = word_freq + context_score
                            word_completions.append((word, total_score))

                    # Sort by score and get the best completion
                    word_completions.sort(key=lambda x: x[1], reverse=True)

                    if word_completions:
                        best_completion = word_completions[0][0]
                        completed_input = " ".join(words[:-1] + [best_completion])
                        complete_sentence = f"{completed_input} {completion}"
                        suggestions.append(
                            (
                                complete_sentence,
                                f"{best_completion} {completion}",
                                confidence,
                            )
                        )
                    else:
                        complete_sentence = f"{input_text} {completion}"
                        suggestions.append((complete_sentence, completion, confidence))
                else:
                    complete_sentence = f"{input_text} {completion}"
                    suggestions.append((complete_sentence, completion, confidence))

        return suggestions

    def getPrediction(self, input_text, num_predictions=10):
        """
        Get next word predictions based on input text (legacy method)

        Args:
            input_text (str): The partial text to predict from
            num_predictions (int): Number of predictions to return

        Returns:
            list: List of tuples (word, confidence_score)
        """
        if not self.trained:
            if not self.train():
                return []

        if not input_text.strip():
            # If empty input, return most common starting words
            most_common = self.word_starts.most_common(num_predictions)
            total = sum(self.word_starts.values())
            return [(word, count / total) for word, count in most_common]

        # Get last words for context
        last_words = self._get_last_words(input_text)
        predictions = Counter()

        # Try trigram prediction first (more context)
        if len(last_words) >= 2:
            key = tuple(last_words[-2:])
            if key in self.trigrams:
                for word, count in self.trigrams[key].items():
                    predictions[word] += count * 2  # Weight trigrams higher

        # Try bigram prediction
        if len(last_words) >= 1:
            last_word = last_words[-1]
            if last_word in self.bigrams:
                for word, count in self.bigrams[last_word].items():
                    predictions[word] += count

        # If no predictions found, try partial matching
        if not predictions and last_words:
            last_word = last_words[-1]
            for word in self.bigrams.keys():
                if word.startswith(last_word.lower()):
                    # Add words that start with the partial word
                    for next_word, count in self.bigrams[word].items():
                        predictions[next_word] += (
                            count * 0.5
                        )  # Lower weight for partial matches

        # Convert to list with confidence scores
        if predictions:
            total = sum(predictions.values())
            result = [
                (word, count / total)
                for word, count in predictions.most_common(num_predictions)
            ]
        else:
            # Fallback to most common starting words
            most_common = self.word_starts.most_common(num_predictions)
            total = sum(self.word_starts.values()) if self.word_starts else 1
            result = [(word, count / total) for word, count in most_common]

        return result


# Global predictor instance
_predictor = None


def getSentenceCompletions(input_text, num_suggestions=5):
    """
    Simple function interface for getting sentence completions

    Args:
        input_text (str): The partial text to complete
        num_suggestions (int): Number of suggestions to return

    Returns:
        list: List of tuples (complete_sentence, predicted_tokens, confidence_score)

    Example:
        >>> completions = getSentenceCompletions("when d", 3)
        >>> print(completions)
        [('when do I win', 'do I win', 8), ('when does it work', 'does it work', 7), ('when did you', 'did you', 6)]
    """
    global _predictor

    if _predictor is None:
        _predictor = WordPredictor()

    return _predictor.getSentenceCompletions(input_text, num_suggestions)


def getPrediction(input_text, num_predictions=10):
    """
    Simple function interface for getting predictions (legacy)

    Args:
        input_text (str): The partial text to predict from
        num_predictions (int): Number of predictions to return

    Returns:
        list: List of predicted words with confidence scores

    Example:
        >>> predictions = getPrediction("What's th", 5)
        >>> print(predictions)
        [('the', 0.85), ('this', 0.10), ('that', 0.03), ('there', 0.02)]
    """
    global _predictor

    if _predictor is None:
        _predictor = WordPredictor()

    return _predictor.getPrediction(input_text, num_predictions)


# Example usage and testing
if __name__ == "__main__":
    # Test the enhanced predictor
    print("=== Enhanced Sentence Completion Predictor ===\n")

    # Example completions
    test_inputs = [
        ("when d", 3),
        ("how are", 3),
        ("I want to", 3),
        ("", 3),  # Empty input
        ("The weather is", 3),
    ]

    for text, num in test_inputs:
        completions = getSentenceCompletions(text, num)
        print(f"Input: '{text}'")
        print("Completions:")
        for i, (complete_sentence, predicted_tokens, confidence) in enumerate(
            completions, 1
        ):
            print(f"  {i}. Complete: '{complete_sentence}'")
            print(f"     Predicted: '{predicted_tokens}' (Confidence: {confidence}/10)")
        print()

    # Interactive mode
    print("=== Interactive Mode ===")
    print("Type partial sentences to get completions (or 'quit' to exit):")

    while True:
        try:
            user_input = input("\n> ").strip()
            if user_input.lower() in ["quit", "exit", "q"]:
                break

            completions = getSentenceCompletions(user_input, 5)
            if completions:
                print("Completions:")
                for i, (complete_sentence, predicted_tokens, confidence) in enumerate(
                    completions, 1
                ):
                    print(f"  {i}. Complete: '{complete_sentence}'")
                    print(
                        f"     Predicted: '{predicted_tokens}' (Confidence: {confidence}/10)"
                    )
            else:
                print("No completions available.")

        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
