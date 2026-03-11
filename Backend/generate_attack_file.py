import pandas as pd
import random
import os

# find project root
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)

# dataset path
data_path = os.path.join(project_root, "data", "processed", "cic_sampled.csv")

print("Loading dataset from:", data_path)

data = pd.read_csv(data_path)

# remove label column
X = data.drop("Label", axis=1)

# sample 20 rows
sample = X.sample(20).copy()

# assign random labels
labels = ["Benign", "Syn", "UDP", "UDPLag"]
sample["Label"] = [random.choice(labels) for _ in range(len(sample))]

# save file
output_path = os.path.join(current_dir, "multi_attack_test.csv")
sample.to_csv(output_path, index=False)

print("File saved at:", output_path)