import React, { useState, useEffect, useMemo } from 'react';

const ArtTasteQuiz = () => {
  // State management
  const [dataset, setDataset] = useState(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [likedArtworks, setLikedArtworks] = useState([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [researchSuggestions, setResearchSuggestions] = useState([]);

  // Configuration
  const QUIZ_SIZE = 15;
  const RECOMMENDATION_COUNT = 10;

  // Load dataset
  useEffect(() => {
    const loadDataset = async () => {
      try {
        const response = await fetch('./quiz_dataset.json');
        const data = await response.json();
        setDataset(data);
      } catch (error) {
        console.error('Failed to load dataset:', error);
      }
    };
    loadDataset();
  }, []);

  // Get random quiz set
  const quizSet = useMemo(() => {
    if (!dataset) return [];
    const shuffled = [...dataset.artworks].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, QUIZ_SIZE);
  }, [dataset]);

  // Handle like/skip
  const handleLike = () => {
    if (quizSet[currentQuizIndex]) {
      setLikedArtworks([...likedArtworks, quizSet[currentQuizIndex]]);
    }
    advanceQuiz();
  };

  const handleSkip = () => {
    setSkippedCount(skippedCount + 1);
    advanceQuiz();
  };

  const advanceQuiz = () => {
    if (currentQuizIndex < quizSet.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
    } else {
      completeQuiz();
    }
  };

  // Analyze and generate recommendations
  const completeQuiz = () => {
    if (likedArtworks.length === 0) {
      setQuizComplete(true);
      return;
    }

    // Extract patterns from liked artworks
    const patterns = analyzePatterns(likedArtworks);
    
    // Find recommendations
    const recs = generateRecommendations(patterns, likedArtworks);
    
    // Create analysis summary
    const summary = createAnalysis(patterns, likedArtworks);

    // Generate research suggestions
    const research = generateResearchSuggestions(patterns, likedArtworks);

    setRecommendations(recs);
    setAnalysis(summary);
    setResearchSuggestions(research);
    setQuizComplete(true);
  };

  const analyzePatterns = (liked) => {
    const patterns = {
      artists: {},
      eras: {},
      centuries: {},
      keywords: {},
      movements: {}
    };

    liked.forEach(art => {
      // Count artists
      if (art.artist) {
        patterns.artists[art.artist] = (patterns.artists[art.artist] || 0) + 1;
      }

      // Extract century from year
      if (art.year) {
        const yearMatch = art.year.match(/(\d{4})/);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          const century = Math.floor(year / 100) * 100;
          patterns.centuries[century] = (patterns.centuries[century] || 0) + 1;
        }
      }

      // Extract keywords from title
      if (art.title) {
        const words = art.title.toLowerCase().split(/[\s\-().,]/);
        words.forEach(word => {
          if (word.length > 3 && !['the', 'and', 'with', 'from'].includes(word)) {
            patterns.keywords[word] = (patterns.keywords[word] || 0) + 1;
          }
        });
      }
    });

    return patterns;
  };

  const generateRecommendations = (patterns, liked) => {
    if (!dataset) return [];

    const likedIds = new Set(liked.map(a => a.id));
    const scored = dataset.artworks
      .filter(art => !likedIds.has(art.id))
      .map(art => {
        let score = 0;

        // Artist match (strong signal)
        if (art.artist && patterns.artists[art.artist]) {
          score += 50;
        }

        // Century match
        if (art.year) {
          const yearMatch = art.year.match(/(\d{4})/);
          if (yearMatch) {
            const year = parseInt(yearMatch[1]);
            const century = Math.floor(year / 100) * 100;
            if (patterns.centuries[century]) {
              score += 30;
            }
          }
        }

        // Keyword match
        if (art.title) {
          const words = art.title.toLowerCase().split(/[\s\-().,]/);
          words.forEach(word => {
            if (patterns.keywords[word]) {
              score += 10;
            }
          });
        }

        return { art, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, RECOMMENDATION_COUNT)
      .map(item => item.art);

    return scored;
  };

  const createAnalysis = (patterns, liked) => {
    const topArtists = Object.entries(patterns.artists)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([artist]) => artist);

    const topCenturies = Object.entries(patterns.centuries)
      .sort((a, b) => b[1] - a[1])
      .map(([century]) => `${parseInt(century) + 1}th century`);

    return {
      likedCount: liked.length,
      topArtists,
      periods: topCenturies,
      insights: generateInsights(liked, topArtists, topCenturies)
    };
  };

  const generateInsights = (liked, topArtists, topPeriods) => {
    const insights = [];

    if (topArtists.length > 0) {
      insights.push(`You're drawn to ${topArtists.join(', ')}—artists known for their distinctive visual languages.`);
    }

    if (topPeriods.length > 0) {
      insights.push(`Your taste clusters around the ${topPeriods[0]}${topPeriods.length > 1 ? ` and ${topPeriods[1]}` : ''}.`);
    }

    if (liked.length >= 10) {
      insights.push(`With ${liked.length} selections, you have a clear aesthetic vision. Your preferences suggest an eye for both technical mastery and emotional depth.`);
    }

    if (liked.some(a => a.year && parseInt(a.year.match(/\d{4}/)[0]) < 1900)) {
      insights.push(`You appreciate historical works—pieces that have endured across generations.`);
    }

    if (liked.some(a => a.title && a.title.toLowerCase().includes('portrait'))) {
      insights.push(`Portraiture resonates with you—the human form and its representation matter.`);
    }

    return insights;
  };

  const generateResearchSuggestions = (patterns, liked) => {
    const suggestions = [];

    // Analyze centuries for movement context
    const topCentury = Object.entries(patterns.centuries)
      .sort((a, b) => b[1] - a[1])[0];

    if (topCentury) {
      const century = parseInt(topCentury[0]);
      
      if (century >= 1900 && century < 1950) {
        suggestions.push({
          title: "Modernist Movements",
          description: "Explore early 20th-century movements like Cubism, Futurism, and Constructivism—the revolutionary artists who reimagined visual language.",
          artists: ["Pablo Picasso", "Wassily Kandinsky", "Joan Miró", "El Lissitzky"]
        });
        
        suggestions.push({
          title: "Surrealism",
          description: "Dive into the dreamlike, subconscious imagery of Surrealism—art that challenges rational perception.",
          artists: ["Salvador Dalí", "Max Ernst", "René Magritte", "André Breton"]
        });
      }
      
      if (century >= 1800 && century < 1900) {
        suggestions.push({
          title: "Impressionism & Post-Impressionism",
          description: "Discover how artists broke from academic tradition to capture light, color, and emotion in radical new ways.",
          artists: ["Claude Monet", "Vincent van Gogh", "Paul Cézanne", "Georges Seurat"]
        });
        
        suggestions.push({
          title: "Realism & Naturalism",
          description: "Explore artists who rejected romanticism to depict everyday life and social truths with unflinching honesty.",
          artists: ["Gustave Courbet", "Jean-François Millet", "Édouard Manet", "Thomas Eakins"]
        });
      }

      if (century >= 1700 && century < 1800) {
        suggestions.push({
          title: "Neoclassicism & Romanticism",
          description: "Study the tension between rational order and emotional expression in the art of revolution and transformation.",
          artists: ["Jacques-Louis David", "Jean-Auguste-Dominique Ingres", "Caspar David Friedrich", "Francisco Goya"]
        });
      }
    }

    // Add movement suggestions based on keywords
    const titleContent = liked.map(a => a.title?.toLowerCase() || '').join(' ');
    
    if (titleContent.includes('portrait')) {
      suggestions.push({
        title: "Portraiture Across Eras",
        description: "Study how different periods and artists approached depicting human identity, emotion, and power.",
        artists: ["Rembrandt", "Elisabeth Vigée Le Brun", "Francisco Goya", "Paul Klee"]
      });
    }

    if (titleContent.includes('landscape') || titleContent.includes('nature')) {
      suggestions.push({
        title: "Landscape & Nature",
        description: "Explore how artists have interpreted the natural world—from literal representation to abstract interpretation.",
        artists: ["J.M.W. Turner", "Caspar David Friedrich", "Paul Cézanne", "Anselm Kiefer"]
      });
    }

    if (titleContent.includes('abstract') || titleContent.includes('composition')) {
      suggestions.push({
        title: "Abstract & Non-Representational Art",
        description: "Investigate how artists moved beyond the visual world to explore pure form, color, and composition.",
        artists: ["Wassily Kandinsky", "Piet Mondrian", "Mark Rothko", "Helen Frankenthaler"]
      });
    }

    // Deduplicate and limit to top 3-4
    const seen = new Set();
    return suggestions.filter(s => {
      if (seen.has(s.title)) return false;
      seen.add(s.title);
      return true;
    }).slice(0, 4);
  };

  // Render states
  if (!dataset) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading artworks...</div>
      </div>
    );
  }

  if (quizComplete) {
    return <ResultsView analysis={analysis} researchSuggestions={researchSuggestions} recommendations={recommendations} onRestart={() => {
      setCurrentQuizIndex(0);
      setLikedArtworks([]);
      setSkippedCount(0);
      setQuizComplete(false);
      setRecommendations([]);
      setAnalysis(null);
      setResearchSuggestions([]);
    }} />;
  }

  if (quizSet.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading artworks...</div>
      </div>
    );
  }

  const currentArt = quizSet[currentQuizIndex];
  const progress = ((currentQuizIndex + 1) / quizSet.length) * 100;

  return (
    <div style={styles.quizContainer}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Discover Your Art Taste</h1>
        <p style={styles.subtitle}>Rate artworks to uncover your aesthetic patterns</p>
      </div>

      {/* Progress bar */}
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }}></div>
      </div>

      {/* Question counter */}
      <div style={styles.counter}>
        {currentQuizIndex + 1} of {quizSet.length}
      </div>

      {/* Artwork display */}
      <div style={styles.artworkContainer}>
        <img
          src={currentArt.image}
          alt={currentArt.title || 'Artwork'}
          style={styles.artworkImage}
        />
        
        {currentArt.title && (
          <div style={styles.artworkInfo}>
            <p style={styles.artworkTitle}>{currentArt.title}</p>
            {currentArt.artist && (
              <p style={styles.artworkArtist}>by {currentArt.artist}</p>
            )}
            {currentArt.year && (
              <p style={styles.artworkYear}>{currentArt.year}</p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={styles.buttonContainer}>
        <button style={styles.skipButton} onClick={handleSkip}>
          ← Skip
        </button>
        <button style={styles.likeButton} onClick={handleLike}>
          ♥ Like
        </button>
      </div>

      {/* Stats */}
      <div style={styles.stats}>
        <span>{likedArtworks.length} liked</span>
        <span>•</span>
        <span>{skippedCount} skipped</span>
      </div>
    </div>
  );
};

// Results view component
const ResultsView = ({ analysis, researchSuggestions, recommendations, onRestart }) => {
  return (
    <div style={styles.resultsContainer}>
      {/* Header */}
      <div style={styles.resultsHeader}>
        <h1 style={styles.resultsTitle}>Your Aesthetic Profile</h1>
        <p style={styles.resultsSubtitle}>Based on {analysis.likedCount} artworks you loved</p>
      </div>

      {/* Analysis section */}
      <div style={styles.analysisSection}>
        <h2 style={styles.sectionTitle}>What We Found</h2>
        
        {analysis.topArtists.length > 0 && (
          <div style={styles.analysisBlock}>
            <h3 style={styles.analysisLabel}>Favorite Artists</h3>
            <p style={styles.analysisContent}>{analysis.topArtists.join(', ')}</p>
          </div>
        )}

        {analysis.periods.length > 0 && (
          <div style={styles.analysisBlock}>
            <h3 style={styles.analysisLabel}>Time Periods</h3>
            <p style={styles.analysisContent}>{analysis.periods.join(', ')}</p>
          </div>
        )}

        {analysis.insights.length > 0 && (
          <div style={styles.insightsSection}>
            <h3 style={styles.analysisLabel}>Insights</h3>
            {analysis.insights.map((insight, idx) => (
              <p key={idx} style={styles.insight}>{insight}</p>
            ))}
          </div>
        )}
      </div>

      {/* Research Suggestions */}
      {researchSuggestions.length > 0 && (
        <div style={styles.researchSection}>
          <h2 style={styles.sectionTitle}>Suggested Research</h2>
          <p style={styles.researchIntro}>Based on your taste, explore these movements and artists to deepen your understanding:</p>
          
          <div style={styles.suggestionsGrid}>
            {researchSuggestions.map((suggestion, idx) => (
              <div key={idx} style={styles.suggestionCard}>
                <h3 style={styles.suggestionTitle}>{suggestion.title}</h3>
                <p style={styles.suggestionDescription}>{suggestion.description}</p>
                <div style={styles.artistsList}>
                  <p style={styles.artistsLabel}>Key Artists:</p>
                  <ul style={styles.artistsUl}>
                    {suggestion.artists.map((artist, aidx) => (
                      <li key={aidx} style={styles.artistItem}>{artist}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations section */}
      {recommendations.length > 0 && (
        <div style={styles.recommendationsSection}>
          <h2 style={styles.sectionTitle}>Artworks We Recommend</h2>
          <div style={styles.recommendationGrid}>
            {recommendations.map(art => (
              <div key={art.id} style={styles.recommendationCard}>
                <img
                  src={art.image}
                  alt={art.title || 'Artwork'}
                  style={styles.recommendationImage}
                />
                {art.title && (
                  <div style={styles.recommendationInfo}>
                    <p style={styles.recTitle}>{art.title}</p>
                    {art.artist && <p style={styles.recArtist}>{art.artist}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Restart button */}
      <div style={styles.restartContainer}>
        <button style={styles.restartButton} onClick={onRestart}>
          Take Quiz Again
        </button>
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  },
  loading: {
    fontSize: '18px',
    color: '#666',
    padding: '40px',
  },
  quizContainer: {
    minHeight: '100vh',
    backgroundColor: '#fafafa',
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'inherit',
  },
  header: {
    padding: '60px 20px 40px',
    textAlign: 'center',
    backgroundColor: '#fff',
    borderBottom: '1px solid #f0f0f0',
  },
  title: {
    fontSize: '36px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: '#1a1a1a',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#888',
    margin: '0',
    fontWeight: '400',
  },
  progressBar: {
    height: '2px',
    backgroundColor: '#e8e8e8',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1a1a1a',
    transition: 'width 0.3s ease',
  },
  counter: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#999',
    fontWeight: '500',
    letterSpacing: '0.5px',
  },
  artworkContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    maxWidth: '800px',
    margin: '0 auto',
    width: '100%',
  },
  artworkImage: {
    maxWidth: '100%',
    maxHeight: '60vh',
    objectFit: 'contain',
    borderRadius: '2px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
  },
  artworkInfo: {
    textAlign: 'center',
    marginTop: '32px',
    width: '100%',
  },
  artworkTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#1a1a1a',
  },
  artworkArtist: {
    fontSize: '15px',
    color: '#666',
    margin: '0 0 4px 0',
    fontWeight: '500',
  },
  artworkYear: {
    fontSize: '13px',
    color: '#999',
    margin: '0',
    fontWeight: '400',
  },
  buttonContainer: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    padding: '32px 20px 40px',
  },
  skipButton: {
    padding: '12px 32px',
    fontSize: '15px',
    fontWeight: '500',
    backgroundColor: '#f5f5f5',
    color: '#1a1a1a',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '120px',
  },
  likeButton: {
    padding: '12px 32px',
    fontSize: '15px',
    fontWeight: '600',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '120px',
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    fontSize: '13px',
    color: '#999',
    paddingBottom: '20px',
  },
  resultsContainer: {
    minHeight: '100vh',
    backgroundColor: '#fafafa',
    padding: '40px 20px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  resultsHeader: {
    textAlign: 'center',
    marginBottom: '60px',
  },
  resultsTitle: {
    fontSize: '36px',
    fontWeight: '600',
    margin: '0 0 12px 0',
    color: '#1a1a1a',
  },
  resultsSubtitle: {
    fontSize: '16px',
    color: '#888',
    margin: '0',
  },
  analysisSection: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '2px',
    marginBottom: '40px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '600',
    margin: '0 0 28px 0',
    color: '#1a1a1a',
  },
  analysisBlock: {
    marginBottom: '28px',
  },
  analysisLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0 0 8px 0',
  },
  analysisContent: {
    fontSize: '18px',
    color: '#1a1a1a',
    margin: '0',
    fontWeight: '500',
  },
  insightsSection: {
    borderTop: '1px solid #f0f0f0',
    paddingTop: '28px',
    marginTop: '28px',
  },
  insight: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#333',
    margin: '0 0 16px 0',
  },
  researchSection: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '2px',
    marginBottom: '40px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  researchIntro: {
    fontSize: '15px',
    color: '#666',
    marginBottom: '32px',
    lineHeight: '1.6',
  },
  suggestionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
  },
  suggestionCard: {
    padding: '24px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    border: '1px solid #f0f0f0',
  },
  suggestionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    margin: '0 0 12px 0',
  },
  suggestionDescription: {
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.5',
    margin: '0 0 16px 0',
  },
  artistsList: {
    marginTop: '16px',
  },
  artistsLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    margin: '0 0 8px 0',
  },
  artistsUl: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
  },
  artistItem: {
    fontSize: '13px',
    color: '#333',
    margin: '4px 0',
    paddingLeft: '12px',
    position: 'relative',
  },
  recommendationsSection: {
    marginBottom: '40px',
  },
  recommendationGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '20px',
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: '2px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'box-shadow 0.2s',
    cursor: 'pointer',
  },
  recommendationImage: {
    width: '100%',
    aspectRatio: '3/4',
    objectFit: 'cover',
  },
  recommendationInfo: {
    padding: '12px',
  },
  recTitle: {
    fontSize: '13px',
    fontWeight: '600',
    margin: '0 0 4px 0',
    color: '#1a1a1a',
    lineHeight: '1.3',
  },
  recArtist: {
    fontSize: '12px',
    color: '#888',
    margin: '0',
    fontWeight: '500',
  },
  restartContainer: {
    textAlign: 'center',
    padding: '40px 0',
  },
  restartButton: {
    padding: '12px 40px',
    fontSize: '15px',
    fontWeight: '600',
    backgroundColor: '#1a1a1a',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default ArtTasteQuiz;
