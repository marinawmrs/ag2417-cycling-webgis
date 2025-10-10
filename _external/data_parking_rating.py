import pandas as pd
from sklearn.cluster import KMeans
import random

df = pd.read_csv("parkings_with_coords.csv")
coords = df[['lat', 'lon']]
kmeans = KMeans(n_clusters=5).fit(coords)
df['cluster'] = kmeans.labels_

cluster_profiles = {
    0: {
        "safety": ([4, 5, 3], [0.5, 0.4, 0.1]),
        "availability": ([2, 3, 1], [0.6, 0.3, 0.1]),
        "vibe": ([4, 5, 2], [0.5, 0.4, 0.1])
    },
    1: {
        "safety": ([2, 3, 1], [0.6, 0.3, 0.1]),
        "availability": ([5, 4, 3], [0.7, 0.2, 0.1]),
        "vibe": ([2, 3, 1], [0.6, 0.3, 0.1])
    },
    2: {
        "safety": ([5, 4, 3], [0.6, 0.3, 0.1]),
        "availability": ([1, 2, 3], [0.7, 0.2, 0.1]),
        "vibe": ([3, 4, 2], [0.6, 0.3, 0.1])
    },
    3: {
        "safety": ([4, 3, 2], [0.6, 0.3, 0.1]),
        "availability": ([3, 4, 5], [0.7, 0.2, 0.1]),
        "vibe": ([4, 3, 5], [0.6, 0.3, 0.1])
    },
    4: {
        "safety": ([2, 1, 3], [0.6, 0.3, 0.1]),
        "availability": ([4, 3, 2], [0.7, 0.2, 0.1]),
        "vibe": ([2, 1, 3], [0.6, 0.3, 0.1])
    },
}

def pick(values, weights):
    return random.choices(values, weights=weights, k=1)[0]

df['safety_rating'] = df['cluster'].apply(lambda c: pick(*cluster_profiles[c]['safety']))
df['availability_rating'] = df['cluster'].apply(lambda c: pick(*cluster_profiles[c]['availability']))
df['vibe_rating'] = df['cluster'].apply(lambda c: pick(*cluster_profiles[c]['vibe']))

df[['parking_id', 'safety_rating', 'availability_rating', 'vibe_rating']].to_csv("parking_ratings.csv", index=False)

import matplotlib.pyplot as plt
import seaborn as sns

plt.figure(figsize=(10, 8))
sns.scatterplot(data=df, x='lon', y='lat', hue='cluster', palette='Set2', s=50)
plt.title("Parking Clusters by Location")
plt.xlabel("Longitude")
plt.ylabel("Latitude")
plt.legend(title="Cluster")
plt.grid(True)
plt.show()

