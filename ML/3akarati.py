import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import OneHotEncoder

# 1. Load the data
df = pd.read_csv('data-1778796084979 (1).csv')

# 2. Split into features and target
x = df.drop(["price", "id"], axis=1)
y = df["price"]

# 3. Train/test split FIRST before any encoding
x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)

# 4. Target encoding function
def get_target_encoding_mapping(train_x, train_y, col, m=10):
    global_mean = train_y.mean()
    stats = train_y.groupby(train_x[col]).agg(['mean', 'count'])
    stats['encoded'] = (stats['count'] * stats['mean'] + m * global_mean) / (stats['count'] + m)
    return stats['encoded'], global_mean

# Fit mappings ONLY on training data
city_mapping, city_mean = get_target_encoding_mapping(x_train, y_train, 'city')
district_mapping, district_mean = get_target_encoding_mapping(x_train, y_train, 'district')

# Apply to both train and test
x_train['city'] = x_train['city'].map(city_mapping).fillna(city_mean)
x_test['city'] = x_test['city'].map(city_mapping).fillna(city_mean)

x_train['district'] = x_train['district'].map(district_mapping).fillna(district_mean)
x_test['district'] = x_test['district'].map(district_mapping).fillna(district_mean)

# 5. One-hot encode type and condition
# Fit ONLY on training data
ohe = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
ohe.fit(x_train[["type", "condition"]])

# Apply to both train and test
ohe_cols = ohe.get_feature_names_out(["type", "condition"])

ohe_train = pd.DataFrame(ohe.transform(x_train[["type", "condition"]]), columns=ohe_cols, index=x_train.index)
ohe_test = pd.DataFrame(ohe.transform(x_test[["type", "condition"]]), columns=ohe_cols, index=x_test.index)

# Drop original columns and concat encoded ones
x_train = x_train.drop(["type", "condition"], axis=1)
x_test = x_test.drop(["type", "condition"], axis=1)

x_train = pd.concat([x_train, ohe_train], axis=1)
x_test = pd.concat([x_test, ohe_test], axis=1)

# 6. Train the model
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(x_train, y_train)


new_data = pd.DataFrame([["shop", 252, 1, 2, 2, "semi finished", "Gharbia", "Tanta"]],
                        columns=["type", "area", "floors", "rooms", "bathrooms", "condition", "city", "district"])

# Apply target encoding using saved mappings
new_data['city'] = new_data['city'].map(city_mapping).fillna(city_mean)
new_data['district'] = new_data['district'].map(district_mapping).fillna(district_mean)

# Apply OHE using saved encoder
new_ohe = pd.DataFrame(ohe.transform(new_data[["type", "condition"]]), columns=ohe_cols, index=new_data.index)
new_data = new_data.drop(["type", "condition"], axis=1)
new_data = pd.concat([new_data, new_ohe], axis=1)

# Match column order
new_data = new_data[x_train.columns]

# Predict
predicted_price = model.predict(new_data)
print(f"Predicted Price: {predicted_price[0]}")